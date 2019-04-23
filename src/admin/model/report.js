module.exports = class extends think.Model {
  /**
   * 生成合伙人报表数据
   * 1.
   * @param null
   * @returns {Promise.<*>}
   */
  async initReport(mobile, username, qstartdate, qenddate) {
    const data = await this.model('user')
      .field(['id', 'username', 'mobile'])
      .where(`(mobile like '%${mobile}%') OR (username like '%${username}%')`)
      .select();
    if (data.length > 0) {
    }
  }
};
