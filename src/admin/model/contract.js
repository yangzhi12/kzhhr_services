module.exports = class extends think.Model {
  /**
   * 生成合同编号
   * @param null
   * @returns {Promise.<*>}
   */
  async getContractno() {
    const year = new Date().getFullYear();
    const amount = await this.model('contract')
      .where({ projectstate: ['=', 31], contractno: ['like', `KZZH${year}%`] })
      .count('contractno');
    return `KZZH${year}${amount + 1}`;
  }
  /**
   * 查询合同附件(合同扫描件、电气主接线图
   * @param contractid
   * @returns {Promise.<*>}
   */
  async getAttachments(contractid) {
    const attachment = await this.model('contract_attachment')
      .where({ contractid: ['=', contractid] })
      .select();
    return attachment;
  }
};
