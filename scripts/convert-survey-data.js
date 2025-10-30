const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * 转换原始问卷数据为抽奖系统格式
 * 从原始Excel文件提取学生基本信息，生成用于抽奖的Excel文件
 */

// 读取原始Excel文件
function readSurveyData(filePath) {
    console.log('正在读取文件:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 获取原始数据
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
        raw: false
    });
    
    console.log('原始数据行数:', rawData.length);
    console.log('第一行数据:', rawData[0]);
    
    return rawData;
}

// 转换数据格式
function convertSurveyData(rawData) {
    console.log('开始转换数据...');
    
    if (rawData.length < 2) {
        throw new Error('数据不足，至少需要标题行和一行数据');
    }
    
    // 解析标题行
    const headers = rawData[0];
    console.log('标题行:', headers);
    
    // 查找需要的字段位置
    const fieldMap = {
        studentId: findColumnIndex(headers, ['學號', 'student_id']),
        name: findColumnIndex(headers, ['識別碼']), // 使用识别码作为姓名（脱敏处理）
        grade: findColumnIndex(headers, ['年級', 'grade']),
        gender: findColumnIndex(headers, ['性別', 'gender']),
        college: findColumnIndex(headers, ['學院', 'college']),
        department: findColumnIndex(headers, ['系所', 'department']),
        admissionType: findColumnIndex(headers, ['入學管道', 'admission_type'])
    };
    
    console.log('字段映射:', fieldMap);
    
    // 转换的数据结果
    const convertedData = [];
    
    // 处理每一行数据（跳过标题行）
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // 跳过空行
        if (!row || row.length === 0 || row.every(cell => !cell)) {
            continue;
        }
        
        try {
            // 提取基本信息
            const student = {
                序號: i, // 序号
                學號: row[fieldMap.studentId] || '',
                姓名: row[fieldMap.name] || '', // 使用识别码作为脱敏姓名
                系所: row[fieldMap.department] || '',
                年級: row[fieldMap.grade] || '',
                應填問卷數: 1, // 假设每个学生应填1份问卷
                已填問卷數: 1, // 假设都已填写（因为有数据就代表填写了）
                是否填畢: 'Y', // 假设都已填毕
                外籍生: 'N', // 默认为非外籍生，可根据需要调整
                有效問卷: 'Y', // 假设都是有效问卷
                身份證字號: '', // 原始数据中没有，留空
                戶籍地址: '', // 原始数据中没有，留空
                手機: '', // 原始数据中没有，留空
                電子郵件: '' // 原始数据中没有，留空
            };
            
            // 验证必需字段
            if (!student.學號) {
                console.warn(`第 ${i+1} 行：缺少学号，跳过`);
                continue;
            }
            
            convertedData.push(student);
            
        } catch (error) {
            console.warn(`第 ${i+1} 行处理错误:`, error.message);
        }
    }
    
    console.log('转换完成，有效数据:', convertedData.length);
    return convertedData;
}

// 查找列索引
function findColumnIndex(headers, possibleNames) {
    for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').trim();
        if (possibleNames.includes(header)) {
            return i;
        }
    }
    return -1;
}

// 生成新的Excel文件
function generateExcelFile(data, outputPath) {
    console.log('生成Excel文件:', outputPath);
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生抽奖名单');
    
    // 写入文件
    XLSX.writeFile(workbook, outputPath);
    console.log('Excel文件已生成:', outputPath);
}

// 主函数
function main() {
    try {
        const inputFile = '學習問卷調查資料(大一)26-JUN-25.xls';
        const outputFile = '學生學習問卷抽獎名單.xlsx';
        
        // 检查输入文件是否存在
        if (!fs.existsSync(inputFile)) {
            console.error('输入文件不存在:', inputFile);
            console.log('请确保文件在当前目录中');
            return;
        }
        
        // 读取原始数据
        const rawData = readSurveyData(inputFile);
        
        // 转换数据
        const convertedData = convertSurveyData(rawData);
        
        if (convertedData.length === 0) {
            console.error('没有有效的数据可转换');
            return;
        }
        
        // 生成新的Excel文件
        generateExcelFile(convertedData, outputFile);
        
        console.log('\n=== 转换完成 ===');
        console.log(`输入文件: ${inputFile}`);
        console.log(`输出文件: ${outputFile}`);
        console.log(`转换记录数: ${convertedData.length}`);
        console.log('\n现在您可以使用生成的Excel文件上传到抽奖系统！');
        
    } catch (error) {
        console.error('转换失败:', error.message);
        console.error('详细错误:', error);
    }
}

// 运行脚本
main(); 