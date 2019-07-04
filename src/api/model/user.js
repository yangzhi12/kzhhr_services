module.exports = class extends think.Model {
  /**
   * 根据用户ID获取用户信息
   * @param userId
   * @returns {Promise.<*>}
   */
  async getUserInfo(userId) {
    const user = await this.model('user')
      .where({ id: userId })
      .select();
    return user;
  }
  /**
   * 获取个人简历和征信图片列表
   * @param userId
   * @returns {Promise.<*>}
   */
  async getUserAttachments(userId) {
    const attachmentList = await this.model('user_attachment')
      .where({ userid: ['=', userId] })
      .select();
    return attachmentList;
  }
  /**
   * 获取家庭成员列表
   * @param userId
   * @returns {Promise.<*>}
   */
  async getUserFamilies(userId) {
    const familyList = await this.model('user_family')
      .where({ userid: ['=', userId] })
      .select();
    return familyList;
  }
  /**
   * 存储个人简历及个人征信证明
   * @param attachmentList, flag, userid
   * @returns {Promise.<*>}
   */
  async saveAttachment(attachmentList, flag, userid) {
    const model = this.model('user_attachment')
    if (flag === 'resume') {
      await model.where({userid: userid, category: 0}).delete()
      if (attachmentList.length > 0) {
        await model.addMany(attachmentList)
      }
    }
    if (flag === 'credit') {
      await model.where({userid: userid, category: 10}).delete()
      if (attachmentList.length > 0) {
        await model.addMany(attachmentList)
      }
    }
  }
};
