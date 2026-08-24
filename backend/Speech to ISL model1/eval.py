import os
os.chdir(r"c:\Users\brame\OneDrive\Desktop\Speech to ISL model")
import main as m

sign_index = m.build_sign_index(m.DATASET_PATH)
m.evaluate_all(sign_index)
