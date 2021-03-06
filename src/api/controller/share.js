const Base = require('./base.js');

module.exports = class extends Base {
  async infoAction() {
    const id = this.get('id');
    const model = this.model('share')
      .field([
        'sha.id',
        'sha.address',
        'sha.detailname',
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
    if (data.length > 0) {
      // 获取照片列表
      const shaids = [];
      data.map(item => {
        shaids.push(item.id);
      });
      const attachments = await model.getShareAttachments(shaids);
      data.map(item => {
        Object.assign(item, { attachments: attachments[item.id] });
      });
    }
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
      createtime: parseInt(new Date().getTime()),
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
      `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y') as year`,
      `QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d')) as Q`,
      `COUNT(*) as amount`,
      `sum(peoples)  as peoples`
    ];
    const model = this.model('share');
    const data = await model
      .field(fields)
      .where(
        `userid=${userid} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d')) < '${enddate}' and  Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y') <= ${year}`
      )
      .group(
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y'),QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(createtime)=13, createtime/1000, createtime)), '%Y-%m-%d'))`
      )
      .select();
    // Q: 季度 Y: 年度 R: 累计
    // T: 分享次数 N: 参与人数
    const res = {
      QT: 0,
      QN: 0,
      YT: 0,
      YN: 0,
      RT: 0,
      RN: 0
    };
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        res['RT'] += data[i].amount;
        res['RN'] += data[i].peoples;
        if (data[i].year === `${year}`) {
          // 汇总年度
          res['YT'] += data[i].amount;
          res['YN'] += data[i].peoples;
          if (`${data[i].Q}` === `${quarter}`) {
            // 按季度统计
            res['QT'] += data[i].amount;
            res['QN'] += data[i].peoples;
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
    const model = this.model('share');
    const data = await model
      .field([
        'sha.id',
        'sha.address',
        'sha.detailname',
        'sha.peoples',
        'sha.userid',
        `Date_FORMAT(FROM_UNIXTIME(if(LENGTH(sha.createtime)=13, sha.createtime/1000, sha.createtime)), '%Y-%m-%d %H:%i:%s') as createtime`,
        'us.username'
      ])
      .alias('sha')
      .join({
        table: 'user',
        join: 'left',
        as: 'us',
        on: ['us.id', 'sha.userid']
      })
      .where(
        `sha.userid=${userid} and Date_FORMAT(FROM_UNIXTIME(if(LENGTH(sha.createtime)=13, sha.createtime/1000, sha.createtime)), '%Y') = ${year} and QUARTER(Date_FORMAT(FROM_UNIXTIME(if(LENGTH(sha.createtime)=13, sha.createtime/1000, sha.createtime)), '%Y-%m-%d')) = ${quarter}`
      )
      .order(['sha.id DESC'])
      .select();
    if (data.length > 0) {
      // 获取照片列表
      const shaids = [];
      data.map(item => {
        shaids.push(item.id);
      });
      const attachments = await model.getShareAttachments(shaids);
      data.map(item => {
        Object.assign(item, { attachments: attachments[item.id] });
      });
    }
    return this.success(data);
  }
};
