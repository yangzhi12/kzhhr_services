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
    // 获取最近10条通知记录
    const notify = await model
      .where({ type: ['=', 'notify'] })
      .order(['id DESC'])
      .limit(10)
      .select();
    // 获取最近10条公告记录
    const notice = await model
      .where({ type: ['=', 'notice'] })
      .order(['id DESC'])
      .limit(10)
      .select();
    this.success(notify.concat(notice));
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
