const apiResponse = (success = true, message = "", data = null) => {
    return {
        status: {
            success: success,
            message: message
        },
        data
    }
}

module.exports = apiResponse