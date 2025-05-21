import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Post, Comment, Like
from faker import Faker

# Initialize Faker with English locale
fake = Faker('en_US')

class Command(BaseCommand):
    help = 'Seed the database with realistic mock users, posts, comments, and likes'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=15, help='Number of users to create')
        parser.add_argument('--posts', type=int, default=40, help='Number of posts to create')
        parser.add_argument('--comments', type=int, default=100, help='Number of comments to create')
        parser.add_argument('--likes', type=int, default=200, help='Number of likes to create')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Like.objects.all().delete()
            Comment.objects.all().delete()
            Post.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Successfully cleared existing data'))

        # Create admin user if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(username='admin', email='admin@example.com', password='admin')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create users with Faker
        num_users = options['users']
        created_users = []
        
        for i in range(num_users):
            # Generate a profile
            profile = fake.profile()
            username = profile['username'].replace('.', '_').lower()
            
            # Ensure username is unique
            suffix = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{suffix}"
                suffix += 1
            
            # Extract first and last name
            name_parts = profile['name'].split()
            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=profile['mail'],
                password='password',  # Same password for all users for testing
                first_name=first_name,
                last_name=last_name
            )
            created_users.append(user)
            self.stdout.write(f"Created user: {user.username} ({user.first_name} {user.last_name})")

        # Get all users including previously created ones
        all_users = list(User.objects.all())
        
        # Create posts
        num_posts = options['posts']
        created_posts = []
        
        for i in range(num_posts):
            author = random.choice(all_users)
            
            # Use faker for title and content
            title = fake.sentence(nb_words=random.randint(4, 10)).rstrip('.')
            
            # Generate realistic content with paragraphs
            num_paragraphs = random.randint(3, 7)
            content_parts = []
            
            # Create paragraphs with Faker
            for p in range(num_paragraphs):
                # Sometimes add headings
                if random.random() > 0.6:
                    content_parts.append(f"## {fake.catch_phrase()}")
                
                # Add paragraph content
                content_parts.append(fake.paragraph(nb_sentences=random.randint(3, 8)))
            
            # Join with double newlines
            content = '\n\n'.join(content_parts)
            
            # Set random creation time within the last 30 days
            hours_ago = random.randint(1, 30*24)  # Up to 30 days ago
            created_time = timezone.now() - timedelta(hours=hours_ago)
            
            # Add a small random time for update (to simulate edits)
            update_hours = random.randint(0, 24)
            update_time = created_time + timedelta(hours=update_hours) if update_hours > 0 else created_time
            
            post = Post.objects.create(
                title=title,
                content=content,
                author=author,
                created_at=created_time,
                updated_at=update_time
            )
            created_posts.append(post)
            
            self.stdout.write(f"Created post: {post.title} by {author.username}")
        
        # Create comments
        num_comments = options['comments']
        created_comments = []
        
        for i in range(num_comments):
            post = random.choice(created_posts)
            author = random.choice(all_users)
            
            # Don't always make authors comment on their own posts
            if author == post.author and random.random() < 0.8:
                # 80% chance to pick a different author
                remaining_users = [u for u in all_users if u != post.author]
                if remaining_users:
                    author = random.choice(remaining_users)
            
            # Use faker for comment content
            content = fake.paragraph(nb_sentences=random.randint(1, 3))
            
            # Set random creation time after post creation but before now
            post_time = post.created_at
            max_hours = int((timezone.now() - post_time).total_seconds() / 3600)
            hours_after_post = random.randint(0, max(1, max_hours))  # At least 1 hour difference
            
            comment_time = post_time + timedelta(hours=hours_after_post)
            
            comment = Comment.objects.create(
                post=post,
                author=author,
                content=content,
                created_at=comment_time,
                updated_at=comment_time
            )
            created_comments.append(comment)
            
            if i % 10 == 0:  # Only show every 10th comment to reduce output
                self.stdout.write(f"Created comment by {author.username} on post: {post.title[:30]}...")
        
        # Create likes
        num_likes = options['likes']
        like_count = 0
        
        # Try to distribute likes somewhat evenly across posts
        likes_per_post = num_likes // len(created_posts) if created_posts else 0
        remaining_likes = num_likes - (likes_per_post * len(created_posts))
        
        # First assign baseline likes to each post
        for post in created_posts:
            # Get random users to like this post
            potential_likers = [u for u in all_users]
            random.shuffle(potential_likers)
            
            # Take only as many likers as needed for this post
            post_likers = potential_likers[:min(likes_per_post, len(potential_likers))]
            
            for user in post_likers:
                # Skip if user already liked this post
                if Like.objects.filter(post=post, user=user).exists():
                    continue
                
                # Random time after post creation
                post_time = post.created_at
                max_hours = int((timezone.now() - post_time).total_seconds() / 3600)
                hours_after_post = random.randint(0, max(1, max_hours))
                like_time = post_time + timedelta(hours=hours_after_post)
                
                Like.objects.create(
                    post=post,
                    user=user,
                    created_at=like_time
                )
                like_count += 1
        
        # Distribute remaining likes randomly
        for _ in range(remaining_likes):
            post = random.choice(created_posts)
            user = random.choice(all_users)
            
            # Skip if user already liked this post
            if Like.objects.filter(post=post, user=user).exists():
                continue
            
            # Random time after post creation
            post_time = post.created_at
            max_hours = int((timezone.now() - post_time).total_seconds() / 3600)
            hours_after_post = random.randint(0, max(1, max_hours))
            like_time = post_time + timedelta(hours=hours_after_post)
            
            Like.objects.create(
                post=post,
                user=user,
                created_at=like_time
            )
            like_count += 1
            
        # Print summary stats
        self.stdout.write(self.style.SUCCESS(
            f'Successfully created:'
            f'\n - {len(created_users)} new users'
            f'\n - {len(created_posts)} posts'
            f'\n - {len(created_comments)} comments'
            f'\n - {like_count} likes'
        ))
        self.stdout.write(self.style.SUCCESS(
            'Mock data has been generated and is stored in the database.'
            '\nThis data will persist and be available when the code is pushed to GitHub.'
        ))
