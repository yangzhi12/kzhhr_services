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

  /**
   * 我的拓展数（我推荐的合伙人个数）
   * @param null
   * @return {Promise.<*>}
   */
  // and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(register_time)=13, register_time/1000, register_time)), '%Y') = ${year}`
  async getRefuserList(userid, year) {
    const user = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.level',
        'us.referee',
        'us.refmap',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y') as year`,
        `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y-%m-%d')) as q`
      ])
      .alias('us')
      .where({ id: ['=', userid] })
      .find();
    const refusers = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.referee',
        'us.refmap',
        'us.level',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y') as year`,
        `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y-%m-%d')) as q`
      ])
      .alias('us')
      .where(`refmap like '${user.refmap}%'`)
      .select();
    return refusers;
  }
};
