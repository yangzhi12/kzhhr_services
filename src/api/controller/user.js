const Base = require('./base.js')
const fs = require('fs')
const _ = require('lodash')

module.exports = class extends Base {
  async infoAction() {
    const userInfo = await this.model('user')
      .where({ id: this.getLoginUserId() })
      .find()
    delete userInfo.password
    return this.json(userInfo)
  }

  /**
   * 保存用户头像
   * @returns {Promise.<void>}
   */
  async saveAvatarAction() {
    const avatar = this.file('avatar')
    if (think.isEmpty(avatar)) {
      return this.fail('保存失败')
    }

    const avatarPath =
      think.RESOURCE_PATH +
      `/static/user/avatar/${this.getLoginUserId()}.` +
      _.last(_.split(avatar.path, '.'))

    fs.rename(avatar.path, avatarPath, function(res) {
      return this.success()
    })
  }

  async registerAction() {
    var _this = this
    var refereeId = null
    if (!_this.isPost) {
      return false
    }
    const values = _this.post()
    // 判断此用户是否已注册
    const mobile = values.mobile
    const username = values.username

    const user = await _this
      .model('user')
      .where({ mobile: mobile })
      .find()
    if (!think.isEmpty(user)) {
      return _this.fail(401, '此手机号已经被注册，请更换手机号')
    }
    // 若此用户为别人推荐则，需判断推荐人是否存在
    if (values.registerType === 'REF') {
      const referee = await _this
        .model('user')
        .where({ mobile: values.refereeMobile })
        .find()
      if (think.isEmpty(referee)) {
        return _this.fail(401, '此推荐人手机号码未注册，请核查')
      }
      if (referee.username !== values.refereeName) {
        return _this.fail(401, '此推荐人手机号码和姓名不一致，请核查')
      }
      refereeId = referee.id
    }
    // 保存用户信息
    values.password_salt = 'ABCDEF'
    values.password = think.md5(values.password + values.password_salt)
    const clientIp = _this.ctx.ip
    const addUser = Object.assign(
      {},
      {
        username: username,
        password: values.password,
        password_salt: values.password_salt,
        register_time: _this.getTime(),
        register_ip: clientIp,
        mobile: values.mobile,
        weixin_no: values.weixinNo,
        avatar: values.avatar || '',
        gender: values.gender, // 性别 null：未知、MALE：男、FEMALE：女
        register_type: values.registerType, //注册方式 REF: 别人推荐 、NO_REF: 自荐
        referee: refereeId,
        certificate: values.certificate
      }
    )
    console.log(addUser)
    let userId = await _this.model('user').add(addUser)
    // 查询用户信息
    const newUserInfo = await _this
      .model('user')
      .field(['id', 'username', 'mobile', 'gender', 'avatar'])
      .where({ id: userId })
      .find()
    // 注册成功后变更新登录信息
    userId = await _this
      .model('user')
      .where({ id: userId })
      .update({
        last_login_time: _this.getTime(),
        last_login_ip: clientIp
      })
    const TokenSerivce = _this.service('token', 'api')
    const sessionKey = await TokenSerivce.create({ user_id: userId })
    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return _this.fail('登录失败')
    }
    return _this.success({ token: sessionKey, userInfo: newUserInfo })
  }
}
