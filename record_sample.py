import cv2

cap = cv2.VideoCapture(0)
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('data/raw_videos/hello/hello1.mp4', fourcc, 20.0, (640, 480))

print("Recording... press 'q' to stop")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    out.write(frame)
    cv2.imshow('Recording', frame)
    if cv2.waitKey(1) == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()
print("Saved to data/raw_videos/hello/hello1.mp4")