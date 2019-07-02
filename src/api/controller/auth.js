const Base = require('./base.js');

module.exports = class extends Base {
  async loginAction() {
    const mobile = this.post('mobile');
    const password = this.post('password');

    const user = await this.model('user')
      .where({ mobile: mobile })
      .find();
    if (think.isEmpty(user)) {
      return this.fail(401, '用户名或密码不正确1');
    }
    if (think.md5(password + '' + user.password_salt) !== user.password) {
      return this.fail(400, '用户名或密码不正确2');
    }

    // 更新登录信息
    await this.model('user')
      .where({ id: user.id })
      .update({
        last_login_time: parseInt(new Date().getTime()),
        last_login_ip: this.ctx.ip
      });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create({
      user_id: user.id
    });

    if (think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      avatar: user.avatar
      // admin_role_id: admin.admin_role_id
    };

    return this.success({ token: sessionKey, userInfo: userInfo });
  }

  async loginByWeixinAction() {
    const code = this.post('code');
    const fullUserInfo = this.post('userInfo');
    const clientIp = this.ctx.ip;

    // 解释用户数据
    const userInfo = await this.service('weixin', 'api').login(
      code,
      fullUserInfo
    );
    if (think.isEmpty(userInfo)) {
      return this.fail('登录失败');
    }

    // 根据openid查找用户是否已经注册
    let userId = await this.model('user')
      .where({ weixin_openid: userInfo.openId })
      .getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        password: '',
        register_time: parseInt(new Date().getTime().getTime() / 1000),
        register_ip: clientIp,
        mobile: '',
        weixin_openid: userInfo.openId,
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1, // 性别 0：未知、1：男、2：女
        nickname: userInfo.nickName
      });
    }

    // 查询用户信息
    const newUserInfo = await this.model('user')
      .field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday'])
      .where({ id: userId })
      .find();

    // 更新登录信息
    userId = await this.model('user')
      .where({ id: userId })
      .update({
        last_login_time: parseInt(new Date().getTime() / 1000),
        last_login_ip: clientIp
      });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create({ user_id: userId });

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    return this.success({ token: sessionKey, userInfo: newUserInfo });
  }

  async logoutAction() {
    return this.success();
  }
};
