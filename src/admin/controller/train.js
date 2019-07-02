const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * levelcontract action
   * @return {Promise} []
   */
  async leveltrainAction() {
    const userid = this.post('userid');
    const startdate = this.post('startdate');
    const enddate = this.post('enddate');
    const model = this.model('train');
    const data = await model
      .field(['tra.id', 'tra.createtime', 'tra.address', 'tra.peoples'])
      .alias('tra')
      .where(
        `tra.userid = ${userid} 
        and tra.createtime > ${startdate} 
        and tra.createtime < ${enddate}`
      )
      .order(['tra.id DESC'])
      .select();
    if (data.length > 0) {
      // 获取照片列表
      const traids = [];
      data.map(item => {
        traids.push(item.id);
      });
      const attachments = await model.getTrainAttachments(traids);
      data.map(item => {
        Object.assign(item, { attachments: attachments[item.id] });
      });
    }
    return this.success(data);
  }
};
