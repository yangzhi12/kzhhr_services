const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise}
   */
  async indexAction() {
    if (!this.isPost) {
      return false;
    }
    const model = this.model('notify');
    const data = await model
      .order(['id DESC'])
      .limit(10)
      .select();
    this.success(data);
  }
  /**
   * store action
   * @return {Promise}
   */
  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    console.log(values);
    const id = await this.model('notify').add(
      Object.assign(values, {
        createtime: new Date().getTime(),
        userid: this.getLoginUserId()
      })
    );
    this.success(id);
  }
  /**
   * delete action
   * @return {Promise}
   */
  async deleteAction() {
    if (!this.isPost) {
      return false;
    }
    const item = this.post('item');
    await this.model('notify')
      .where({
        id: ['=', item.id]
      })
      .delete();
    this.success();
  }
};
