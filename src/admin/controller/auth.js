const Base = require('./base.js');

module.exports = class extends Base {
  async loginAction() {
    const mobile = this.post('mobile');
    const password = this.post('password');

    const admin = await this.model('admin')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.password',
        'us.password_salt',
        'ro.roleno',
        'ro.rolename'
      ])
      .alias('us')
      .join({
        table: 'admin_role',
        join: 'left',
        as: 'ro',
        on: ['ro.id', 'us.admin_role_id']
      })
      .where({ mobile: mobile })
      .find();
    if (think.isEmpty(admin)) {
      return this.fail(401, '手机号或密码不正确1');
    }
    if (think.md5(password + '' + admin.password_salt) !== admin.password) {
      return this.fail(400, '手机号或密码不正确2');
    }

    // 更新登录信息
    await this.model('admin')
      .where({ id: admin.id })
      .update({
        last_login_time: parseInt(new Date().getTime() / 1000),
        last_login_ip: this.ctx.ip
      });

    const TokenSerivce = this.service('token', 'admin');

    const sessionKey = await TokenSerivce.create({
      user_id: admin.id
    });

    if (think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    const userInfo = {
      id: admin.id,
      username: admin.username,
      mobile: admin.mobile,
      roleid: admin.roleid,
      roleno: admin.roleno,
      rolename: admin.rolename
    };

    return this.success({ token: sessionKey, userInfo: userInfo });
  }
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.post('page') || 1;
    const size = this.post('size') || 10;
    const name = this.post('name') || '';
    const mobile = this.post('mobile') || '';
    const model = this.model('admin');
    // .where({ username: ['like', `%${name}%`] })
    const data = await model
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'ro.roleno',
        'ro.rolename',
        'us.last_login_time'
      ])
      .alias('us')
      .join({
        table: 'admin_role',
        join: 'left',
        as: 'ro',
        on: ['ro.id', 'us.admin_role_id']
      })
      .where(
        "(us.username like '%" +
          `${name}` +
          "%')" +
          "OR (us.mobile like '%" +
          `${mobile}` +
          "%')"
      )
      .order(['us.id DESC'])
      .page(page, size)
      .countSelect();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('admin')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'ro.id as roleid',
        'ro.roleno',
        'ro.rolename'
      ])
      .alias('us')
      .join({
        table: 'admin_role',
        join: 'left',
        as: 'ro',
        on: ['ro.id', 'us.admin_role_id']
      });
    const data = await model.where({ 'us.id': id }).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    const id = this.post('id');
    const roleid = this.post('roleid');
    Object.assign(values, {
      admin_role_id: roleid
    });
    const model = this.model('admin');
    if (id > 0) {
      await model.where({ id: id }).update(values);
    } else {
      // 如果手机号相同则存储失败，提示该用户已注册
      const user = await this.model('admin')
        .where({ mobile: values.mobile })
        .find();
      if (!think.isEmpty(user)) {
        return this.fail(401, '此手机号已经被注册，请更换手机号');
      } else {
        Object.assign(values, {
          password: think.md5('123456ABCDEF'),
          password_salt: 'ABCDEF'
        });
        delete values.id;
        await model.add(values);
      }
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('admin')
      .where({ id: id })
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.success();
  }

  async modifypasswordAction() {
    const id = this.post('id');
    const password = this.post('password');
    await this.model('admin')
      .where({ id: id })
      .update({ password: think.md5(password + 'ABCDEF') });
    return this.success();
  }

  async resetpasswordAction() {
    const id = this.post('id');
    await this.model('admin')
      .where({ id: id })
      .update({ password: think.md5('123456ABCDEF') });
    return this.success();
  }
};
