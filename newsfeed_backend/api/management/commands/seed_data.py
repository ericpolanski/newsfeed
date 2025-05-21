import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Post
from faker import Faker

fake = Faker()

MOCK_USERS = [
    {"username": "john_doe", "email": "john@example.com", "first_name": "John", "last_name": "Doe"},
    {"username": "jane_smith", "email": "jane@example.com", "first_name": "Jane", "last_name": "Smith"},
    {"username": "bob_johnson", "email": "bob@example.com", "first_name": "Bob", "last_name": "Johnson"},
    {"username": "alice_williams", "email": "alice@example.com", "first_name": "Alice", "last_name": "Williams"},
    {"username": "charlie_brown", "email": "charlie@example.com", "first_name": "Charlie", "last_name": "Brown"},
    {"username": "emma_davis", "email": "emma@example.com", "first_name": "Emma", "last_name": "Davis"},
    {"username": "michael_wilson", "email": "michael@example.com", "first_name": "Michael", "last_name": "Wilson"},
    {"username": "olivia_jones", "email": "olivia@example.com", "first_name": "Olivia", "last_name": "Jones"},
]

POST_TITLES = [
    "The Future of Remote Work",
    "10 Must-Read Books of 2025",
    "Healthy Habits for Developers",
    "Tech Trends to Watch",
    "Exploring Machine Learning",
    "The Art of Productivity",
    "Sustainable Living Tips",
    "Travel Destinations for Tech Enthusiasts",
    "Building Better Web Applications",
    "Photography Basics for Beginners",
    "Modern Architecture Marvels",
    "The Science Behind Good Sleep",
    "Understanding Blockchain Technology",
    "Fitness Tips for Busy People",
    "Amazing Space Discoveries",
]

class Command(BaseCommand):
    help = 'Seed the database with mock users and posts'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=8, help='Number of users to create')
        parser.add_argument('--posts', type=int, default=25, help='Number of posts to create')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Post.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Successfully cleared existing data'))

        # Create admin user if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(username='admin', email='admin@example.com', password='admin')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create mock users
        users = []
        for user_data in MOCK_USERS:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password='password',
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
                users.append(user)
                self.stdout.write(f"Created user: {user.username}")

        # Get all users including previously created ones
        all_users = list(User.objects.all())
        
        # Create mock posts
        num_posts = options['posts']
        for i in range(num_posts):
            author = random.choice(all_users)
            
            # Use a predefined title or generate a random one
            if i < len(POST_TITLES):
                title = POST_TITLES[i]
            else:
                title = fake.sentence().rstrip('.')
            
            # Generate post content
            paragraphs = fake.paragraphs(nb=random.randint(1, 4))
            content = '\n\n'.join(paragraphs)
            
            # Set random creation time within the last 30 days
            hours_ago = random.randint(1, 30*24)  # Up to 30 days ago
            created_time = timezone.now() - timedelta(hours=hours_ago)
            
            post = Post.objects.create(
                title=title,
                content=content,
                author=author,
                created_at=created_time,
                updated_at=created_time
            )
            
            self.stdout.write(f"Created post: {post.title} by {author.username}")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(users)} new users and {num_posts} new posts'))
