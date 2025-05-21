from django.contrib.auth.models import User
from ariadne import QueryType, MutationType, ObjectType, make_executable_schema, gql, ScalarType
from .models import Post, Comment, Like
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate, login, get_user_model

# GraphQL Type Definitions
type_defs = gql("""
    type User {
        id: ID!
        username: String!
        email: String
        firstName: String
        lastName: String
    }
    
    type AuthPayload {
        token: String
        user: User
    }

    type Comment {
        id: ID!
        content: String!
        author: User!
        createdAt: String!
        updatedAt: String!
        isAuthor: Boolean!
    }

    type Like {
        id: ID!
        user: User!
        createdAt: String!
    }

    type Post {
        id: ID!
        title: String!
        content: String!
        author: User!
        createdAt: String!
        updatedAt: String!
        isAuthor: Boolean!
        likesCount: Int!
        commentsCount: Int!
        likes: [Like!]!
        comments: [Comment!]!
        isLiked: Boolean!
    }

    type Query {
        allPosts: [Post!]!
        post(id: ID!): Post
        me: User
        postComments(postId: ID!): [Comment!]!
    }

    input CreatePostInput {
        title: String!
        content: String!
    }

    input UpdatePostInput {
        title: String
        content: String
    }
    
    input SignupInput {
        username: String!
        password: String!
        email: String!
        firstName: String
        lastName: String
    }
    
    input LoginInput {
        username: String!
        password: String!
    }

    input CreateCommentInput {
        postId: ID!
        content: String!
    }
    
    input UpdateCommentInput {
        content: String!
    }

    type Mutation {
        createPost(input: CreatePostInput!): Post
        updatePost(id: ID!, input: UpdatePostInput!): Post
        deletePost(id: ID!): Post
        
        signup(input: SignupInput!): AuthPayload
        login(input: LoginInput!): AuthPayload
        verifyToken(token: String!): Boolean
        refreshToken(token: String!): String
        
        likePost(postId: ID!): Post
        unlikePost(postId: ID!): Post
        
        createComment(input: CreateCommentInput!): Comment
        updateComment(id: ID!, input: UpdateCommentInput!): Comment
        deleteComment(id: ID!): Comment
    }
""")

# Query Resolvers
query = QueryType()

@query.field("allPosts")
def resolve_all_posts(_, info):
    return Post.objects.select_related('author').all()

@query.field("post")
def resolve_post(_, info, id):
    try:
        return Post.objects.select_related('author').get(pk=id)
    except Post.DoesNotExist:
        return None
        
@query.field("me")
def resolve_me(_, info):
    context = info.context
    
    # Get the user from the context, handling both dict and object scenarios
    user = None
    if isinstance(context, dict):
        request = context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
    elif hasattr(context, 'request') and hasattr(context.request, 'user'):
        user = context.request.user
    
    # Check if we have a valid authenticated user
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        return user
        
    return None
    
@query.field("postComments")
def resolve_post_comments(_, info, postId):
    try:
        return Comment.objects.filter(post_id=postId).select_related('author').order_by('-created_at')
    except Exception as e:
        print(f"Error getting comments: {e}")
        return []

# Mutation Resolvers
mutation = MutationType()

@mutation.field("createPost")
def resolve_create_post(_, info, input):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        post = Post.objects.create(
            title=input['title'],
            content=input['content'],
            author=user
        )
        return post
    except Exception as e:
        # Handle other potential errors
        print(f"Error creating post: {e}")
        return None

@mutation.field("updatePost")
def resolve_update_post(_, info, id, input):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
        
        post = Post.objects.get(pk=id)
        
        # Check if the user is the author of the post
        if post.author != user:
            return None  # User is not authorized to update this post
            
        if input.get('title'):
            post.title = input['title']
        if input.get('content'):
            post.content = input['content']
        post.save()
        return post
    except Post.DoesNotExist:
        return None
    except Exception as e:
        return None

@mutation.field("deletePost")
def resolve_delete_post(_, info, id):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        post = Post.objects.get(pk=id)
        
        # Check if the user is the author of the post
        if post.author != user:
            return None  # User is not authorized to delete this post
            
        post.delete()
        return post # Return the deleted post for confirmation
    except Post.DoesNotExist:
        return None
    except Exception as e:
        return None

# Helper function to generate JWT tokens
def generate_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token
    
# Helper function to get the current user from context
def get_user_from_context(context):
    user = None
    if isinstance(context, dict):
        request = context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
    elif hasattr(context, 'request') and hasattr(context.request, 'user'):
        user = context.request.user
    
    # Check if we have a valid authenticated user
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        return user
    
    return None

# Authentication Mutation Resolvers
@mutation.field("signup")
def resolve_signup(_, info, input):
    username = input.get('username')
    password = input.get('password')
    email = input.get('email')
    first_name = input.get('firstName', '')
    last_name = input.get('lastName', '')
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return None  # User already exists
        
    # Create the user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Generate JWT token
    token = generate_token(user)
    
    # Return token and user
    return {
        'token': token,
        'user': user
    }
    
@mutation.field("login")
def resolve_login(_, info, input):
    username = input.get('username')
    password = input.get('password')
    
    # Authenticate the user
    user = authenticate(username=username, password=password)
    
    if user is None:
        return None  # Authentication failed
        
    # Generate JWT token
    token = generate_token(user)
    
    # Return token and user
    return {
        'token': token,
        'user': user
    }
    
@mutation.field("verifyToken")
def resolve_verify_token(_, info, token):
    try:
        # Verify the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        # Check if user exists
        user_id = payload.get('user_id')
        user = User.objects.filter(id=user_id).first()
        return user is not None
    except jwt.PyJWTError:
        return False
        
@mutation.field("refreshToken")
def resolve_refresh_token(_, info, token):
    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'], options={"verify_exp": False})
        # Get user
        user_id = payload.get('user_id')
        user = User.objects.filter(id=user_id).first()
        
        if user:
            # Generate new token
            new_token = generate_token(user)
            return new_token
        return None
    except jwt.PyJWTError:
        return None
        
@mutation.field("likePost")
def resolve_like_post(_, info, postId):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        post = Post.objects.get(pk=postId)
        
        # Check if the user already liked this post
        existing_like = Like.objects.filter(post=post, user=user).first()
        if not existing_like:
            # Create the like
            Like.objects.create(post=post, user=user)
        
        return post
    except Post.DoesNotExist:
        return None
    except Exception as e:
        print(f"Error liking post: {e}")
        return None
        
@mutation.field("unlikePost")
def resolve_unlike_post(_, info, postId):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        post = Post.objects.get(pk=postId)
        
        # Find and delete the like if it exists
        Like.objects.filter(post=post, user=user).delete()
        
        return post
    except Post.DoesNotExist:
        return None
    except Exception as e:
        print(f"Error unliking post: {e}")
        return None

@mutation.field("createComment")
def resolve_create_comment(_, info, input):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        post_id = input.get('postId')
        content = input.get('content')
        
        if not content.strip():
            return None  # Empty comment
            
        post = Post.objects.get(pk=post_id)
        
        comment = Comment.objects.create(
            post=post,
            author=user,
            content=content
        )
        
        return comment
    except Post.DoesNotExist:
        return None
    except Exception as e:
        print(f"Error creating comment: {e}")
        return None

@mutation.field("updateComment")
def resolve_update_comment(_, info, id, input):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        comment = Comment.objects.get(pk=id)
        
        # Check if the user is the author of the comment
        if comment.author != user:
            return None  # User is not authorized to update this comment
            
        comment.content = input.get('content')
        comment.save()
        
        return comment
    except Comment.DoesNotExist:
        return None
    except Exception as e:
        print(f"Error updating comment: {e}")
        return None

@mutation.field("deleteComment")
def resolve_delete_comment(_, info, id):
    try:
        # Get the user from the context
        user = get_user_from_context(info.context)
        
        # Make sure the user is authenticated
        if not user:
            return None  # User not authenticated
            
        comment = Comment.objects.get(pk=id)
        
        # Check if the user is the author of the comment
        if comment.author != user:
            return None  # User is not authorized to delete this comment
            
        comment.delete()
        return comment  # Return the deleted comment for confirmation
    except Comment.DoesNotExist:
        return None
    except Exception as e:
        print(f"Error deleting comment: {e}")
        return None

# Post Type Resolver (for nested fields)
post_type = ObjectType("Post")

@post_type.field("author")
def resolve_post_author(obj, info):
    # obj is the Post instance
    return obj.author

@post_type.field("createdAt")
def resolve_post_created_at(obj, info):
    return obj.created_at.isoformat()

@post_type.field("updatedAt")
def resolve_post_updated_at(obj, info):
    return obj.updated_at.isoformat()

@post_type.field("isAuthor")
def resolve_post_is_author(obj, info):
    # Check if the current user is the author of the post using the helper function
    user = get_user_from_context(info.context)
    
    # If we have an authenticated user, check if they're the author
    if user:
        return obj.author.id == user.id
    
    return False

@post_type.field("likesCount")
def resolve_post_likes_count(obj, info):
    # Use the cached property from the model to get the likes count
    return obj.likes_count

@post_type.field("commentsCount")
def resolve_post_comments_count(obj, info):
    # Use the cached property from the model to get the comments count
    return obj.comments_count
    
@post_type.field("likes")
def resolve_post_likes(obj, info):
    # Return all likes for this post
    return obj.likes.select_related('user').all()

@post_type.field("comments")
def resolve_post_comments(obj, info):
    # Return all comments for this post, sorted by creation time (newest first)
    return obj.comments.select_related('author').order_by('-created_at')
    
@post_type.field("isLiked")
def resolve_post_is_liked(obj, info):
    # Check if the current user has liked this post
    user = get_user_from_context(info.context)
    
    if not user:
        return False
        
    return obj.likes.filter(user=user).exists()
    
# User Type (can be expanded if needed)
user_type = ObjectType("User")

@user_type.field("firstName")
def resolve_user_first_name(obj, info):
    return obj.first_name

@user_type.field("lastName")
def resolve_user_last_name(obj, info):
    return obj.last_name

@user_type.field("email")
def resolve_user_email(obj, info):
    # Only return email if the user is requesting their own info
    current_user = get_user_from_context(info.context)
    if current_user and current_user.id == obj.id:
        return obj.email
    return None

# Comment Type Resolver
comment_type = ObjectType("Comment")

@comment_type.field("author")
def resolve_comment_author(obj, info):
    # Return the author of the comment
    return obj.author

@comment_type.field("createdAt")
def resolve_comment_created_at(obj, info):
    return obj.created_at.isoformat()

@comment_type.field("updatedAt")
def resolve_comment_updated_at(obj, info):
    return obj.updated_at.isoformat()

@comment_type.field("isAuthor")
def resolve_comment_is_author(obj, info):
    # Check if the current user is the author of the comment
    user = get_user_from_context(info.context)
    
    if not user:
        return False
        
    return obj.author.id == user.id

# Like Type Resolver
like_type = ObjectType("Like")

@like_type.field("user")
def resolve_like_user(obj, info):
    return obj.user

@like_type.field("createdAt")
def resolve_like_created_at(obj, info):
    return obj.created_at.isoformat()

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation, post_type, user_type, comment_type, like_type)
