const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 30;
    const rolename = this.post('rolename') || '';
    const roleno = this.post('roleno') || '';

    const model = this.model('admin_role');
    // .where({ username: ['like', `%${name}%`] })
    const data = await model
      .where(
        "(rolename like '%" +
        `${rolename}` +
        "%')" +
        "OR (roleno like '%" +
        `${roleno}` +
        "%')"
      )
      .order(['id DESC'])
      .page(page, size)
      .countSelect();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('admin_role');
    const data = await model.where({ id: id }).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    const id = this.post('id');

    const model = this.model('admin_role');
    values.is_show = values.is_show ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    if (id > 0) {
      // 如果分组编号相同则存储失败，提示该分组已存在
      const isExistsRole = model.where({ roleno: values.roleno });
      if (isExistsRole) {
        return this.fail(401, '该分组已存在.');
      } else {
        await model.where({ id: id }).update(values);
      }
    } else {
      // 如果分组编号相同则存储失败，提示该分组已存在
      const isExistsRole = model.where({ roleno: values.roleno });
      if (isExistsRole) {
        return this.fail(401, '该分组已存在.');
      } else {
        delete values.id;
        await model.add(values);
      }
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('admin_role')
      .where({ id: id })
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.success();
  }
};
