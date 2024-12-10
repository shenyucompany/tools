from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
import chardet
import codecs
import io
import os
import tempfile
from docx import Document
from reportlab.pdfgen import canvas
from striprtf.striprtf import rtf_to_text
from typing import Optional

router = APIRouter()

class EncodingRequest(BaseModel):
    text: str
    from_encoding: str
    to_encoding: str

@router.post("/api/format/convert-encoding")
async def convert_encoding(request: EncodingRequest):
    try:
        # 如果输入编码是自动检测
        if request.from_encoding.upper() == 'AUTO':
            detected = chardet.detect(request.text.encode())
            from_encoding = detected['encoding']
        else:
            from_encoding = request.from_encoding

        # 先解码为Unicode，再编码为目标编码
        text_bytes = request.text.encode(from_encoding, 'ignore')
        converted_text = text_bytes.decode(request.to_encoding, 'ignore')

        return {"text": converted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"编码转换失败: {str(e)}")

@router.post("/api/format/convert-file")
async def convert_file(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    encoding: Optional[str] = Form('utf-8')
):
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, file.filename)
    output_path = None

    try:
        # 保存上传的文件
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        # 根据目标格式进行转换
        if target_format == 'txt':
            # 如果是文本格式，尝试进行编码转换
            with open(input_path, 'rb') as f:
                raw_content = f.read()
                detected = chardet.detect(raw_content)
                text = raw_content.decode(detected['encoding'], 'ignore')
                converted = text.encode(encoding, 'ignore').decode(encoding)
                
            output_path = os.path.join(temp_dir, "converted.txt")
            with open(output_path, 'w', encoding=encoding) as f:
                f.write(converted)

        elif target_format == 'doc':
            # 创建Word文档
            doc = Document()
            with open(input_path, 'r', encoding=encoding) as f:
                text = f.read()
                doc.add_paragraph(text)
            
            output_path = os.path.join(temp_dir, "converted.docx")
            doc.save(output_path)

        elif target_format == 'pdf':
            # 创建PDF文档
            output_path = os.path.join(temp_dir, "converted.pdf")
            c = canvas.Canvas(output_path)
            with open(input_path, 'r', encoding=encoding) as f:
                text = f.read()
                # 简单分页处理
                y = 800
                for line in text.split('\n'):
                    if y < 50:  # 页面空间不足时添加新页
                        c.showPage()
                        y = 800
                    c.drawString(50, y, line)
                    y -= 15
            c.save()

        elif target_format == 'rtf':
            # 创建RTF文档
            output_path = os.path.join(temp_dir, "converted.rtf")
            with open(input_path, 'r', encoding=encoding) as f:
                text = f.read()
                # 简单的RTF格式化
                rtf_content = (
                    "{\\rtf1\\ansi\\deff0"
                    "{\\\fonttbl{\\\f0\\fnil\\fcharset0 Arial;}}"
                    "{\\\colortbl;\\red0\\green0\\blue0;}"
                    "\\viewkind4\\uc1\\pard\\cf1\\f0\\fs24 " +
                    text.replace('\n', '\\par\n') +
                    "}"
                )
            with open(output_path, 'w', encoding='ascii', errors='ignore') as f:
                f.write(rtf_content)

        else:
            raise HTTPException(status_code=400, detail="不支持的目标格式")

        # 读取转换后的文件
        with open(output_path, 'rb') as f:
            content = f.read()

        # 设置正确的Content-Type
        content_types = {
            'txt': 'text/plain',
            'doc': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'pdf': 'application/pdf',
            'rtf': 'application/rtf'
        }

        return Response(
            content=content,
            media_type=content_types.get(target_format, 'application/octet-stream'),
            headers={
                "Content-Disposition": f'attachment; filename="converted.{target_format}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件转换失败: {str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(input_path):
            os.remove(input_path)
        if output_path and os.path.exists(output_path):
            os.remove(output_path)
        os.rmdir(temp_dir) 