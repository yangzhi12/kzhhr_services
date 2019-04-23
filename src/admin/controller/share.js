const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * levelcontract action
   * @return {Promise} []
   */
  async levelshareAction() {
    const userid = this.post('userid');
    const startdate = this.post('startdate');
    const enddate = this.post('enddate');
    const model = this.model('share');
    const data = await model
      .field(['sha.id', 'sha.createtime', 'sha.address', 'sha.peoples'])
      .alias('sha')
      .where(
        `sha.userid = ${userid} 
        and sha.createtime > ${startdate} 
        and sha.createtime < ${enddate}`
      )
      .order(['sha.id DESC'])
      .select();
    if (data.length > 0) {
      // 获取照片列表
      const shaids = [];
      data.map(item => {
        shaids.push(item.id);
      });
      const attachments = await model.getShareAttachments(shaids);
      data.map(item => {
        Object.assign(item, { attachments: attachments[item.id] });
      });
    }
    return this.success(data);
  }
};
