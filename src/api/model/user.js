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
};
