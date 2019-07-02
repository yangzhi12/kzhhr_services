module.exports = class extends think.Model {
  /**
   * 获取图片列表
   * @param null
   * @returns {Promise.<*>}
   */
  async getTrainAttachments(trainids) {
    const attachmentList = await this.model('train_attachment')
      .where({ trainid: ['in', trainids] })
      .select();
    var attachments = {};
    trainids.map(item => {
      attachments[item] = [];
    });
    attachmentList.map(item => {
      if (attachments.hasOwnProperty(item.trainid)) {
        attachments[item.trainid].push(item);
      } else {
        attachments[item.trainid] = [].push(item);
      }
    });
    return attachments;
  }
};
