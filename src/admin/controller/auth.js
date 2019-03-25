const Base = require('./base.js');

module.exports = class extends Base {
  async loginAction() {
    const mobile = this.post('mobile');
    const password = this.post('password');

    const admin = await this.model('admin')
      .where({ mobile: mobile })
      .find();
    if (think.isEmpty(admin)) {
      return this.fail(401, '手机号或密码不正确1');
    }
    // console.log(think.md5(password + '' + admin.password_salt));
    if (think.md5(password + '' + admin.password_salt) !== admin.password) {
      return this.fail(400, '手机号或密码不正确2');
    }

    // 更新登录信息
    await this.model('admin')
      .where({ id: admin.id })
      .update({
        last_login_time: parseInt(Date.now() / 1000),
        last_login_ip: this.ctx.ip
      });

    const TokenSerivce = this.service('token', 'admin');

    const sessionKey = await TokenSerivce.create({
      user_id: admin.id
    });

    console.log(admin.id);
    console.log(sessionKey);

    if (think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    const userInfo = {
      id: admin.id,
      username: admin.username,
      mobile: admin.mobile,
      avatar: admin.avatar,
      admin_role_id: admin.admin_role_id
    };

    return this.success({ token: sessionKey, userInfo: userInfo });
  }
};
