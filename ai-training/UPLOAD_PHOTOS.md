# Easiest way to give me the real photos

The project is ready, but `data/raw/` is empty. I cannot make real note images or safely guess which photos show the same physical bill. You do not need to give me account passwords or Google Drive access.

## Do this

1. On your phone, photograph each genuine bill you own or have permission to use. Take one clear photo of the front and one of the back. Keep every edge visible. Keep original photos; do not screenshot, edit, or add serial numbers to filenames.
2. Make one folder per physical bill. Give each folder a short ID and put that bill's front/back photos inside. Example:

   ```text
   photos/
     PHP100-0001/
       front.jpg
       back.jpg
     PHP100-0002/
       front.jpg
       back.jpg
     PHP500-0001/
       front.jpg
       back.jpg
   ```

   The folder ID must refer to the same actual bill in every photo. Never use the printed serial number. The denomination in the folder ID should match the printed denomination.
3. Zip the `photos` folder and attach the ZIP here, or copy the photographs into `ai-training/data/raw/` while keeping the per-note folders.

I can then check the image files, prepare the annotation rows from those folder names and visible note details, and run the dataset validator. I will ask you to resolve anything I cannot identify confidently; I will not invent labels. Photos stay in this private project workspace and should not be posted publicly.

## What to collect

Start with every physical bill you can photograph across ₱20, ₱50, ₱100, ₱200, ₱500, and ₱1,000. The current splitter needs at least three distinct bills for each denomination; that is only a technical minimum and is not enough to establish dependable performance. More different bills and real camera/light variation are better than many nearly identical pictures of one bill.

`data/annotations.csv` is the ready-to-fill annotation sheet. Do not run training yet. We first need real photos and verified labels, then we validate and split by physical bill ID.
