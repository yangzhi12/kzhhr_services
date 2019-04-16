module.exports = class extends think.Model {
  /**
   * 生成合同编号
   * @param null
   * @returns {Promise.<*>}
   */
  async getShareAttachments(shareids) {
    const attachmentList = await this.model('share_attachment')
      .where({ id: ['in', shareids] })
      .select();
    return attachmentList;
  }
};
