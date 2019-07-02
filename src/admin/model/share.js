module.exports = class extends think.Model {
  /**
   * 获取图片列表
   * @param null
   * @returns {Promise.<*>}
   */
  async getShareAttachments(shareids) {
    const attachmentList = await this.model('share_attachment')
      .where({ shareid: ['in', shareids] })
      .select();
    var attachments = {};
    shareids.map(item => {
      attachments[item] = [];
    });
    attachmentList.map(item => {
      if (attachments.hasOwnProperty(item.shareid)) {
        attachments[item.shareid].push(item);
      } else {
        attachments[item.shareid] = [].push(item);
      }
    });
    return attachments;
  }
};
