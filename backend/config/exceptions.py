from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "server_error",
                    "message": "An unexpected error occurred.",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    message = "Request failed."
    details = response.data
    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = str(response.data["detail"])
        elif response.data:
            first_key = next(iter(response.data))
            first_value = response.data[first_key]
            if isinstance(first_value, list) and first_value:
                message = str(first_value[0])
            else:
                message = str(first_value)
    elif isinstance(response.data, list) and response.data:
        message = str(response.data[0])

    response.data = {
        "success": False,
        "error": {
            "code": f"http_{response.status_code}",
            "message": message,
            "details": details,
        },
    }
    return response
