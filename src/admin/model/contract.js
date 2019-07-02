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
      .count();
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
  /**
   * 我的拓展数（我推荐的合伙人个数）
   * @param null
   * @return {Promise.<*>}
   */
  // and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(register_time)=13, register_time/1000, register_time)), '%Y') = ${year}`
  async getRefuserList(userid) {
    const user = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.level',
        'le.name as levelname',
        'us.referee',
        'us.refmap',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y') as year`,
        `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y-%m-%d')) as q`
      ])
      .alias('us')
      .join({
        table: 'level',
        join: 'left',
        as: 'le',
        on: ['us.level', 'le.no']
      })
      .where({ 'us.id': ['=', userid] })
      .find();
    const refusers = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.mobile',
        'us.referee',
        'us.refmap',
        'us.level',
        'le.name as levelname',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y') as year`,
        `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y-%m-%d')) as q`
      ])
      .alias('us')
      .join({
        table: 'level',
        join: 'left',
        as: 'le',
        on: ['us.level', 'le.no']
      })
      .where(`refmap like '${user.refmap}%'`)
      .select();
    return refusers;
  }
  /**
   * 昆自合伙人
   * @param null
   * @return {Promise.<*>}
   */
  // and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(register_time)=13, register_time/1000, register_time)), '%Y') = ${year}`
  async getRefAllUserList() {
    const refusers = await this.model('user')
      .field([
        'us.id',
        'us.username',
        'us.username as name',
        'us.mobile',
        'us.referee',
        'us.refmap',
        'us.level',
        'le.name as levelname',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y') as year`,
        `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(us.register_time)=13, us.register_time/1000, us.register_time)), '%Y-%m-%d')) as q`
      ])
      .alias('us')
      .join({
        table: 'level',
        join: 'left',
        as: 'le',
        on: ['us.level', 'le.no']
      })
      .select();
    return refusers;
  }
};
