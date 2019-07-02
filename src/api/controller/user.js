const Base = require('./base.js');
const fs = require('fs');
const _ = require('lodash');

module.exports = class extends Base {
  async infoAction() {
    const userInfo = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.gender',
        'us.certificate',
        'us.weixin_no',
        'us.level',
        'us.state',
        'us.register_type',
        're.username as refereename',
        're.mobile as refereemobile',
        'us.email',
        'us.bankno',
        'us.bankaddress',
        'us.contractfiles',
        'us.wiringdiagrams',
        'us.address'
      ])
      .alias('us')
      .join({
        table: 'user',
        join: 'left',
        as: 're',
        on: ['us.referee', 're.id']
      })
      .where({ 'us.id': this.getLoginUserId() })
      .find();

    // const userfam = await model('user_family')
    //   .where({'userfam.id': this.getLoginUserId() })
    //   .select();
    // let userInfo = Object.assign(
    //   userInfoadd,userfam
    // )
    // console.log(userInfo)

    return this.json(userInfo);
  }

  async famAction(){
    let _this = this
    const famInfo = await _this.model('user_family')
      .where({userid:_this.getLoginUserId()})
      .select()

    // console.log(famInfo)

    return this.json(famInfo);
  }

  async updatefamlilyAction() {
    if (!this.isPost){
      return false;
    }
    let values = this.post()
    const famupdate = this.model('user_family').where({id:values.id}).update({
      name:values.name,
      appellation:values.appel,
      address:values.address,
      mobile:values.mobile
    })

    console.log(famupdate)

    return this.success({famupdate:famupdate})
  }

  async deletefamlilyAction() {
     if (!this.isPost){
      return false;
    }
    let values = this.post()
    await this.model('user_family').where({id:values.id}).delete();

    return this.success('删除成功')
  }

  //获取用户id
  // async idAction(){
  //   let _this = this
  //   if (!_this.isPost){
  //     return false;
  //   }
  //   const values = _this.post()

  //   console.log(values.id)

  //   const idupdate = _this.model('user_id').where().update({id01:values.id})

  //   return _this.success()
  // }

  /**
   * 保存用户头像
   * @returns {Promise.<void>}
   */
  async saveAvatarAction() {
    const avatar = this.file('avatar');
    if (think.isEmpty(avatar)) {
      return this.fail('保存失败');
    }

    const avatarPath =
      think.RESOURCE_PATH +
      `/static/user/avatar/${this.getLoginUserId()}.` +
      _.last(_.split(avatar.path, '.'));

    fs.rename(avatar.path, avatarPath, function(res) {
      return this.success();
    });
  }

  async registerAction() {
    var _this = this;
    var refereeId = null;
    var refmap = null;
    if (!_this.isPost) {
      return false;
    }
    const values = _this.post();
    // 判断此用户是否已注册
    const mobile = values.mobile;
    const username = values.username;

    const user = await _this
      .model('user')
      .where({ mobile: mobile })
      .find();
    if (!think.isEmpty(user)) {
      return _this.fail(401, '此手机号已经被注册，请更换手机号');
    }
    // 若此用户为别人推荐则，需判断推荐人是否存在
    if (values.registerType === 'REF') {
      const referee = await _this
        .model('user')
        .where({ mobile: values.refereeMobile })
        .find();
      if (think.isEmpty(referee)) {
        return _this.fail(401, '此推荐人手机号码未注册，请核查');
      }
      if (referee.username !== values.refereeName) {
        return _this.fail(401, '此推荐人手机号码和姓名不一致，请核查');
      }
      refereeId = referee.id;
      refmap = referee.refmap
        ? `${referee.refmap}.${refereeId}`
        : `${refereeId}.`;
    }
    // 保存用户信息
    values.password_salt = 'ABCDEF';
    values.password = think.md5(values.password + values.password_salt);
    const clientIp = _this.ctx.ip;
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
        register_type: values.registerType, // 注册方式 REF: 别人推荐 、NO_REF: 自荐
        referee: refereeId,
        certificate: values.certificate,
        refmap: refmap, // 引荐关系链
        level: 0, // 用户级别
        state: 0 // 档案状态
      }
    );
    let userId = await _this.model('user').add(addUser);
    // 查询用户信息
    const newUserInfo = await _this
      .model('user')
      .field(['id', 'username', 'mobile', 'gender', 'avatar'])
      .where({ id: userId })
      .find();
    // 注册成功后变更新登录信息
    userId = await _this
      .model('user')
      .where({ id: userId })
      .update({
        last_login_time: _this.getTime(),
        last_login_ip: clientIp
      });
    const TokenSerivce = _this.service('token', 'api');
    const sessionKey = await TokenSerivce.create({ user_id: userId });
    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return _this.fail('登录失败');
    }
    return _this.success({ token: sessionKey, userInfo: newUserInfo });
  }
  // 根据用户ID查询用户信息
  async modifypwdAction() {
    if (!this.isPost) {
      return false;
    }
    const password_salt = 'ABCDEF';
    const values = this.post();
    const model = this.model('user');
    const oldpwd = await model
      .field(['password'])
      .where({ id: ['=', values.id] })
      .find();
    if (oldpwd) {
      const upwd = think.md5(values.oldpassword + password_salt);
      if (upwd !== oldpwd.password) {
        return this.fail('原密码输入错误，请重新输入!');
      } else {
        const npwd = think.md5(values.newpassword + password_salt);
        const udata = await model
          .where({ id: values.id })
          .update({ password: npwd });
        if (udata) {
          return this.success(udata);
        }
      }
    } else {
      return this.fail('该用户不存在!');
    }
  }

  //保存家庭成员
  async addfamlilyAction(){
    var _this = this;
    if (!_this.isPost) {
      return false;
    }

    const values = _this.post();
    const addFamlilyNum = Object.assign(
      {},
      {
        userid: this.getLoginUserId(),
        name:values.name,
        appellation:values.appellation,
        mobile:values.mobile,
        address:values.address,
      }
    )

   let familyid = await _this.model('user_family').add(addFamlilyNum);

   return _this.success({familyid: familyid});

  }

  //完善个人信息
  async completefamlilyAction(){
    var _this = this;

    if(!_this.isPost){
      return false;
    }

    const values = _this.post();

    let model = _this.model('user');

    let comnumfam = await model.where({id:this.getLoginUserId()}).update({
      // username:values.username,
      // gender:values.gender,
      // mobile:values.mobile,
      // weixinno:values.weixinno,
      // level: values.level,
      // state: values.state,
      email:values.email,
      bankno:values.bankno,
      bankaddress:values.bankaddress,
      address:values.address,
      wiringdiagrams: values.wiringdiagrams,
      contractfiles: values.contractfiles
    });

    // let famupdate = await model('user_family').where(id:).update({

    // })
    //个人简历信息
    //const id = await model.add(values);
    // const wiringdiagrams = values.wiringdiagrams;
    // if (wiringdiagrams && wiringdiagrams.length > 0) {
    //   // 存储所分享的照片
    //   const filemodel = _this.model('user_resume_attachment');
    //   await filemodel.addMany(wiringdiagrams);
    // }

    //个人征信证明
    // const contractfiles = values.contractfiles;
    // if (contractfiles && contractfiles.length > 0) {
    //   // 存储所分享的照片
    //   const filemodelredict = _this.model('user_resume_attachment');
    //   await filemodelredict.addMany(contractfiles);
    // }

    return _this.success({comnumfam:comnumfam})

  }
};
