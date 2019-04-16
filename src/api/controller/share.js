const Base = require('./base.js');

module.exports = class extends Base {
  async infoAction() {
    const id = this.get('id');
    const model = this.model('share')
      .field([
        'sha.id',
        'sha.address',
        'sha.name',
        'sha.starttime',
        'sha.peoples',
        'sha.userid',
        'sha.createtime',
        'us.username'
      ])
      .alias('sha')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'sha.userid']
      });
    const data = await model.where({ 'sha.id': id }).find();
    // 获取照片列表
    const shaids = [];
    data.map(item => {
      shaids.push(item.id);
    });
    const attachments = await model.getShareAttachments(shaids);
    Object.assign(data, { attachments: attachments });
    return this.success(data);
  }

  /**
   * store action 新增签单
   */
  async storeAction() {
    if (!this.isPost) {
      return false;
    }
    const values = this.post();
    console.log(values);
    Object.assign(values, {
      createtime: parseInt(new Date().getTime() / 1000),
      userid: this.getLoginUserId()
    });
    const model = this.model('share');
    const id = await model.add(values);
    const attachments = values.attachments;
    if (attachments && attachments.length > 0) {
      // 存储所分享的照片
      const filemodel = this.model('share_attachment');
      attachments.map(file => {
        delete file.path;
        Object.assign(file, { shareid: id });
        return file;
      });
      await filemodel.addMany(attachments);
    }
    return this.success();
  }

  /**
   * statq action 根据签单人按季度签单量
   * @return {Promise} {}
   */
  async statqAction() {
    if (!this.isPost) {
      return false;
    }
    // 输入参数
    const userid = this.getLoginUserId(); // 签单人
    const year = this.post('year'); // 所选年份（字符串）
    const quarter = this.post('quarter'); // 所选季度（1, 2, 3, 4）
    const nextquarter = {
      '1': `${year}-04-01`,
      '2': `${year}-07-01`,
      '3': `${year}-10-01`,
      '4': `${Number(year) + 1}-01-01`
    };
    const enddate = nextquarter[`${quarter}`];
    // 返回字段
    const fields = [
      `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') as year`,
      `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) as Q`,
      `COUNT(*) as amount`,
      `sum(contractvalue)  as contractvalue`,
      `sum(recommendvalue)  as recommendvalue`
    ];
    const model = this.model('contract');
    const data = await model
      .field(fields)
      .where(
        `userid=${userid} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d')) < '${enddate}' and  Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y') <= ${year}`
      )
      .group(
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y'),QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(contractstart)=13, contractstart/1000, contractstart)), '%Y-%m-%d'))`
      )
      .select();
    // Q: 季度 Y: 年度 R: 累计
    // T: 合同个数 M: 合同金额 N: 基准单数(金额大于3000分为两单)
    const res = {
      QT: 0,
      QM: 0,
      QMR: 0,
      QN: 0,
      YT: 0,
      YM: 0,
      YMR: 0,
      YN: 0,
      RT: 0,
      RM: 0,
      RMR: 0,
      RN: 0
    };
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        res['RT'] += data[i].amount;
        res['RM'] += data[i].contractvalue;
        res['RMR'] += data[i].contractvalue;
        res['RN'] += data[i].contractvalue / 30000;
        if (data[i].year === `${year}`) {
          // 汇总年度
          res['YT'] += data[i].amount;
          res['YM'] += data[i].contractvalue;
          res['YMR'] += data[i].contractvalue;
          res['YN'] += data[i].contractvalue / 30000;
          if (`${data[i].Q}` === `${quarter}`) {
            // 按季度统计
            res['QT'] += data[i].amount;
            res['QM'] += data[i].contractvalue;
            res['QMR'] += data[i].contractvalue;
            res['QN'] += data[i].contractvalue / 30000;
          }
        }
      }
    }
    return this.success(res);
  }
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    if (!this.isPost) {
      return false;
    }
    const year = this.post('year') || '';
    const quarter = this.post('quarter') || '';
    const userid = this.getLoginUserId();
    const model = this.model('contract');
    const data = await model
      .field([
        'con.id',
        'con.contractno',
        'con.contractname',
        'con.contractvalue',
        'con.recommendvalue',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y-%m-%d') as contractstart`,
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractend)=13, con.contractend/1000, con.contractend)), '%Y-%m-%d') as contractend`,
        'us.username',
        'con.contractstate'
      ])
      .alias('con')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'con.userid']
      })
      .where(
        `con.userid=${userid} and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y') = ${year} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(con.contractstart)=13, con.contractstart/1000, con.contractstart)), '%Y-%m-%d')) = ${quarter}`
      )
      .order(['con.id DESC'])
      .select();
    return this.success(data);
  }
};
