const Department = require('../../models/Department');

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'name', 'code']
    });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
