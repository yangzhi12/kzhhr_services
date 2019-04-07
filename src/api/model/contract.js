module.exports = class extends think.Model {
  /**
   * 生成合同编号
   * @param null
   * @returns {Promise.<*>}
   */
  async getContractno() {
    const amount = await this.model('contract')
      .where({ lawstate: ['=', 51] })
      .count('contractno');
    const year = new Date().getFullYear();
    return `KZZH${year}${amount + 1}`;
  }
};
