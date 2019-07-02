const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.post('page') || 1;
    const size = this.post('size') || 10;
    const name = this.post('name') || '';
    const mobile = this.post('mobile') || '';

    const model = this.model('user');
    // .where({ username: ['like', `%${name}%`] })
    const data = await model
      .where(
        "(username like '%" +
          `${name}` +
          "%')" +
          "OR (mobile like '%" +
          `${mobile}` +
          "%')"
      )
      .order(['id DESC'])
      .page(page, size)
      .countSelect();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('user');
    const data = await model.where({ id: id }).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('user');
    if (id > 0) {
      // 暂不提供修改功能
    } else {
      // 如果手机号及姓名相同则存储失败，提示该用户已注册
      const user = await model.where({ mobile: values.mobile }).find();
      if (!think.isEmpty(user)) {
        return this.fail(401, '该手机号已注册.');
      } else {
        delete values.id;
        if (values.password && values.password + '') {
        } else {
          Object.assign(values, {
            password: think.md5('123456ABCDEF'),
            password_salt: 'ABCDEF'
          });
        }
        await model.add(values);
      }
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('user')
      .where({ id: id })
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.success();
  }

  async resetpasswordAction() {
    const id = this.post('id');
    await this.model('user')
      .where({ id: id })
      .update({ password: think.md5('123456ABCDEF') });
    return this.success();
  }
};
