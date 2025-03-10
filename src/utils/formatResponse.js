// Utility function to format Mongoose documents by replacing _id with id
const formatResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...item.toObject(),
      id: item._id.toString(),
      _id: undefined, // Remove _id from response
    }));
  }

  if (data && data.toObject) {
    return {
      ...data.toObject(),
      id: data._id.toString(),
      _id: undefined, // Remove _id from response
    };
  }

  return data;
};

module.exports = formatResponse;
