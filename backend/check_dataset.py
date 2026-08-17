import os

DATASET_DIR = "../dataset"

total_videos = 0
classes = {}

# Go through category folders
for category in sorted(os.listdir(DATASET_DIR)):

    category_path = os.path.join(DATASET_DIR, category)

    if not os.path.isdir(category_path):
        continue

    # Go through label folders inside category
    for label in sorted(os.listdir(category_path)):

        label_path = os.path.join(category_path, label)

        if not os.path.isdir(label_path):
            continue

        videos = [
            f for f in os.listdir(label_path)
            if f.lower().endswith(".mp4")
        ]

        if videos:
            class_name = label
            classes[class_name] = len(videos)
            total_videos += len(videos)

print("\n========== DATASET SUMMARY ==========\n")

print("Number of labels:", len(classes))
print("Total videos:", total_videos)

print("\nVideos per label:\n")

for label, count in classes.items():
    print(f"{label}: {count}")

print("\n=====================================")