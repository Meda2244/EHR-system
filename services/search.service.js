// services/search.service.js

class SearchService {
  static async searchByNationalId(model, nationalId) {
    try {
      const user = await model.findOne({ nationalId: nationalId });
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async searchByEmail(model, email) {
    try {
      const user = await model.findOne({ email: email });
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async searchByName(model, firstName, lastName) {
    try {
      const users = await model.find({
        firstName: { $regex: firstName, $options: 'i' },
        lastName: { $regex: lastName, $options: 'i' }
      });
      return users;
    } catch (error) {
      throw error;
    }
  }

  static async getAllUsers(model, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const users = await model.find().skip(skip).limit(limit);
      const total = await model.countDocuments();
      
      return {
        data: users,
        total: total,
        page: page,
        limit: limit,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SearchService;