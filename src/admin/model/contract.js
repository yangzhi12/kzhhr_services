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
};
