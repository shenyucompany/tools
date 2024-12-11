from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import pytesseract
import io
from typing import List
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
import os
import tempfile

router = APIRouter()

def preprocess_image(image):
    """预处理图片，确保质量和格式正确"""
    # 如果是RGBA模式，转换为RGB
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # 调整图片大小，如果太大的话
    max_size = (2000, 2000)  # 设置最大尺寸
    if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    return image

def save_image_for_ocr(image):
    """保存图片到临时文件用于OCR"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    try:
        # 保存为PNG格式，避免JPEG压缩问题
        image.save(temp_file.name, 'PNG', quality=95)
        return temp_file.name
    except Exception as e:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise e

@router.post("/api/image/to-pdf")
async def convert_images_to_pdf(files: List[UploadFile] = File(...)):
    temp_files = []  # 跟踪临时文件
    try:
        # 创建PDF缓冲区
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        
        for file in files:
            try:
                # 读取图片
                image_data = await file.read()
                image = Image.open(io.BytesIO(image_data))
                
                # 预处理图片
                image = preprocess_image(image)
                
                # OCR识别文本
                try:
                    # 保存预处理后的图片用于OCR
                    temp_file_path = save_image_for_ocr(image)
                    temp_files.append(temp_file_path)
                    
                    # 使用临时文件进行OCR
                    text = pytesseract.image_to_string(temp_file_path, lang='chi_sim+eng')
                except Exception as ocr_error:
                    print(f"OCR failed: {str(ocr_error)}")
                    text = ""
                
                # 获取图片尺寸
                img_w, img_h = image.size
                
                # 计算适合的页面大小
                margin = 50
                max_width = letter[0] - (2 * margin)
                max_height = letter[1] - (2 * margin)
                
                # 计算缩放比例
                width_ratio = max_width / img_w
                height_ratio = max_height / img_h
                scale = min(width_ratio, height_ratio)
                
                # 计算最终尺寸
                final_width = img_w * scale
                final_height = img_h * scale
                
                # 计算居中位置
                x = (letter[0] - final_width) / 2
                y = (letter[1] - final_height) / 2
                
                # 将图片转换为RGB模式（如果需要）并保存到内存中
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                img_buffer = io.BytesIO()
                image.save(img_buffer, format='JPEG', quality=95)
                img_buffer.seek(0)
                
                # 绘制图片
                c.drawImage(ImageReader(img_buffer), x, y, width=final_width, height=final_height)
                
                # 添加文本层
                if text.strip():
                    c.setFont("Helvetica", 0.1)
                    text_object = c.beginText()
                    text_object.setTextOrigin(margin, margin)
                    
                    for line in text.split('\n'):
                        if line.strip():
                            text_object.textLine(line.strip())
                    
                    c.drawText(text_object)
                
                c.showPage()
                
            except Exception as img_error:
                print(f"Error processing image: {str(img_error)}")
                continue
            
        c.save()
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=converted_with_ocr.pdf"
            }
        )
        
    except Exception as e:
        print(f"Conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 清理临时文件
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                print(f"Error deleting temp file {temp_file}: {str(e)}") 