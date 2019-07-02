const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * indexnotify action
   * @return {Promise}
   */
  async indexnotifyAction() {
    if (!this.isPost) {
      return false;
    }
    const model = this.model('notify');
    // 获取最近10条通知记录
    const notify = await model
      .field([
        'id',
        'title',
        'content',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d') as createtime`
      ])
      .where({ type: ['=', 'notify'] })
      .order(['id DESC'])
      .limit(10)
      .select();
    this.success(notify);
  }
  /**
   * indexnotice action
   * @return {Promise}
   */
  async indexnoticeAction() {
    if (!this.isPost) {
      return false;
    }
    const model = this.model('notify');
    // 获取最近10条公告记录
    const notice = await model
      .field([
        'id',
        'title',
        'content',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d') as createtime`
      ])
      .where({ type: ['=', 'notice'] })
      .order(['id DESC'])
      .limit(10)
      .select();
    this.success(notice);
  }
  /**
   * info action
   * @return {Promise}
   */
  async infoAction() {
    if (!this.isPost) {
      return false;
    }
    const id = this.post('id');
    const model = this.model('notify');
    // 获取最近10条公告记录
    const notify = await model
      .field([
        'id',
        'title',
        'content',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d') as createtime`
      ])
      .where({ id: ['=', id] })
      .find();
    this.success(notify);
  }
};
