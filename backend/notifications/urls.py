from django.urls import path

from notifications.views import MarkNotificationReadView, NotificationListView

urlpatterns = [
    path("notifications", NotificationListView.as_view(), name="notifications_list"),
    path("notifications/mark-read", MarkNotificationReadView.as_view(), name="notifications_mark_read"),
]
