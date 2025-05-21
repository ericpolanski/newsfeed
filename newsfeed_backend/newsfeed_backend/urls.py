"""
URL configuration for newsfeed_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from ariadne_django.views import GraphQLView # Import GraphQLView
from api.schema import schema # Import your schema
from django.contrib.auth.models import User
import jwt
from django.conf import settings

# Create a custom GraphQLView that includes the request in the context and handles JWT auth
class CustomGraphQLView(GraphQLView):
    def get_context_for_request(self, request):
        context = {"request": request}
        
        # Extract token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('JWT '):
            token = auth_header.split(' ')[1]
            try:
                # Decode and verify the token
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                if user_id:
                    # Attach user to request if token is valid
                    user = User.objects.filter(id=user_id).first()
                    if user:
                        request.user = user
            except jwt.PyJWTError:
                # Invalid token, continue with anonymous user
                pass
                
        return context

urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", CustomGraphQLView.as_view(schema=schema), name="graphql"),
]
