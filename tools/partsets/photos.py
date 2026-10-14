"""Tìm ảnh (photo / hình bảng biểu) trong các trang PDF DA. Trả về danh sách (trang, x0,y0,x1,y1 theo pixel ở dpi đã render)."""
import cv2, numpy as np, subprocess, tempfile, glob, os, re
def render(pdf, dpi, outdir, first=None, last=None):
    os.makedirs(outdir, exist_ok=True)
    cmd=['pdftoppm','-r',str(dpi),'-png']
    if first: cmd+=['-f',str(first),'-l',str(last or first)]
    subprocess.run(cmd+[pdf,os.path.join(outdir,'p')],check=True)
    fs=glob.glob(os.path.join(outdir,'p-*.png'))
    return sorted(fs,key=lambda f:int(re.search(r'p-(\d+)\.png$',f).group(1)))
def find_images(png, min_frac=0.12):
    im=cv2.imread(png); g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY); H,W=g.shape
    # ảnh chụp: vùng có nhiều điểm không trắng liên tục; chữ thì mảnh -> đóng (close) mạnh rồi lọc theo độ "đặc"
    nonwhite=(g<235).astype(np.uint8)
    k=cv2.getStructuringElement(cv2.MORPH_RECT,(9,9))
    m=cv2.morphologyEx(nonwhite,cv2.MORPH_CLOSE,k)
    n,lab,st,_=cv2.connectedComponentsWithStats(m,8)
    out=[]
    for i in range(1,n):
        x,y,w,h,a=st[i]
        if w<W*min_frac or h<H*0.06: continue
        fill=nonwhite[y:y+h,x:x+w].mean()
        if fill<0.35: continue      # khối chữ / khung trắng
        out.append((x,y,x+w,y+h,round(float(fill),2)))
    return sorted(out,key=lambda b:(b[1],b[0])),(W,H)
