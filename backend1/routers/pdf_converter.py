from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pdf2docx import Converter
import os
import tempfile
from typing import Optional
import logging
import traceback
import shutil

router = APIRouter()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@router.post("/api/convert-pdf-to-word")
async def convert_pdf_to_word(file: UploadFile):
    pdf_path = None
    docx_path = None
    
    try:
        # 记录开始转换
        logger.info(f"开始转换文件: {file.filename}")
        
        # 检查文件类型
        if not file.content_type == "application/pdf":
            logger.warning(f"文件类型错误: {file.content_type}")
            raise HTTPException(status_code=400, detail="只支持PDF文件")

        # 创建临时目录
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, "input.pdf")
        docx_path = os.path.join(temp_dir, "output.docx")

        # 保存上传的PDF文件
        content = await file.read()
        logger.info(f"文件大小: {len(content)} bytes")
        
        with open(pdf_path, 'wb') as f:
            f.write(content)
        logger.info(f"PDF文件保存成功: {pdf_path}")

        # 转换PDF到Word
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        logger.info("PDF转换为Word完成")

        # 检查生成的文件是否存在
        if not os.path.exists(docx_path):
            raise Exception("转换后的Word文件未生成")

        # 获取文件大小
        docx_size = os.path.getsize(docx_path)
        logger.info(f"生成的Word文件大小: {docx_size} bytes")

        # 将转换后的文件复制到新的临时文件
        final_docx_path = tempfile.mktemp(suffix='.docx')
        shutil.copy2(docx_path, final_docx_path)

        # 清理原始临时目录
        shutil.rmtree(temp_dir)

        # 创建响应
        response = FileResponse(
            final_docx_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename=file.filename.replace('.pdf', '.docx'),
            background=None  # 禁用后台任务
        )

        # 设置响应头
        response.headers["Content-Disposition"] = f'attachment; filename="{file.filename.replace(".pdf", ".docx")}"'
        logger.info("响应创建成功")

        # 设置回调以在响应发送后删除临时文件
        async def cleanup():
            try:
                if os.path.exists(final_docx_path):
                    os.unlink(final_docx_path)
                    logger.info(f"清理最终Word文件: {final_docx_path}")
            except Exception as e:
                logger.error(f"清理最终文件时出错: {str(e)}")

        response.background = cleanup
        return response

    except Exception as e:
        # 清理临时文件
        if pdf_path and os.path.exists(os.path.dirname(pdf_path)):
            shutil.rmtree(os.path.dirname(pdf_path))
        
        logger.error(f"处理请求时出错: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}") 