import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import * as XLSX from 'xlsx'

export const useLotteryStore = defineStore('lottery', () => {
    const lotteryTypes = ref([
        {
            id: 'general',
            name: '學生學習問卷抽獎',
            description: '針對學生學習問卷填寫情況進行的抽獎活動'
        },
        {
            id: 'final_teaching',
            name: '期末評量抽獎',
            description: '針對期末評量參與情況進行的抽獎活動'
        }
    ])
    const selectedType = ref(null)
    const lotteryEvents = ref([])
    const currentEvent = ref(null)
    const participants = ref([])
    const participantsTotal = ref(0)
    const prizeSettings = ref([])
    const winners = ref({})
    const loading = ref(false)
    const error = ref(null)

    // Select lottery type
    const selectType = (typeId) => {
        selectedType.value = typeId
        // Clear previous data when switching types
        lotteryEvents.value = []
        currentEvent.value = null
        participants.value = []
        participantsTotal.value = 0
        prizeSettings.value = []
        winners.value = {}
    }

    // Fetch lottery events by type
    const fetchLotteryEvents = async (eventType = null) => {
        loading.value = true
        error.value = null

        try {
            const params = {}
            if (eventType) {
                params.event_type = eventType
            }

            const response = await api.get('/lottery/events', { params })
            lotteryEvents.value = response.data.result
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法取得抽獎活動列表'
            console.error('Error fetching lottery events:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    // Select a lottery event
    const selectEvent = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get(`/lottery/events/${eventId}`)
            currentEvent.value = response.data.result
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法取得抽獎活動資訊'
            console.error('Error selecting lottery event:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    // Fetch participants for current event
    const fetchParticipants = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get(`/lottery/events/${eventId}/participants`)
            participants.value = response.data.result.participants
            participantsTotal.value = response.data.result.total
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法取得參與者名單'
            console.error('Error fetching participants:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    // Save prize settings for current event
    const savePrizeSettings = async (eventId, prizes) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post(`/lottery/events/${eventId}/prizes`, { prizes })
            prizeSettings.value = response.data.result
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法儲存獎項設定'
            console.error('Error saving prize settings:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    // Fetch prize settings for current event
    const fetchPrizeSettings = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get(`/lottery/events/${eventId}/prizes`)
            prizeSettings.value = response.data.result.prizes
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法取得獎項設定'
            console.error('Error fetching prize settings:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    // Run lottery for current event
    const runLottery = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post(`/lottery/events/${eventId}/draw`)
            winners.value = response.data.result
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '抽獎過程發生錯誤'
            console.error('Error running lottery:', err)
            return {}
        } finally {
            loading.value = false
        }
    }

    // Export winners list
    const exportWinners = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            // Download the winners export file directly
            const response = await api.get(`/lottery/events/${eventId}/winners/export`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `中獎名單_${eventId}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()

            return true
        } catch (err) {
            error.value = err.response?.data?.message || '匯出名單失敗'
            console.error('Error exporting winners:', err)
            return false
        } finally {
            loading.value = false
        }
    }

    // Get winners for current event
    const fetchWinners = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get(`/lottery/events/${eventId}/winners`)
            winners.value = response.data.result
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法取得中獎名單'
            console.error('Error fetching winners:', err)
            return {}
        } finally {
            loading.value = false
        }
    }

    // Delete lottery event (soft delete)
    const deleteEvent = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.delete(`/lottery/events/${eventId}`)
            // Remove the event from the local list
            const index = lotteryEvents.value.findIndex(event => event.id === eventId)
            if (index !== -1) {
                lotteryEvents.value.splice(index, 1)
            }
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '無法刪除抽獎活動'
            console.error('Error deleting event:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    // Test winners notification with custom email list
    const testWinnersNotification = async (eventId, emailData) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post(`/email/test-winners/${eventId}`, emailData)
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '測試郵件送信失敗'
            console.error('Error testing winners notification:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    // Create a new lottery event
    const createLotteryEvent = async (eventData) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post('/lottery/events', eventData)
            const newEvent = response.data.result
            lotteryEvents.value.push(newEvent)
            return newEvent
        } catch (err) {
            error.value = err.response?.data?.message || '建立抽獎活動失敗'
            console.error('Error creating lottery event:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update an existing lottery event
    const updateLotteryEvent = async (eventId, eventData) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.put(`/lottery/events/${eventId}`, eventData)
            const updatedEvent = response.data.result
            
            // Update the event in local state
            const index = lotteryEvents.value.findIndex(event => event.id === eventId)
            if (index !== -1) {
                lotteryEvents.value[index] = updatedEvent
            }
            
            // Update current event if it's the one being edited
            if (currentEvent.value && currentEvent.value.id === eventId) {
                currentEvent.value = updatedEvent
            }
            
            return updatedEvent
        } catch (err) {
            error.value = err.response?.data?.message || '更新抽獎活動失敗'
            console.error('Error updating lottery event:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Import participants from Excel data
    const importParticipants = async (eventId, studentsData) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post(`/lottery/events/${eventId}/participants`, {
                students: studentsData
            })
            
            // Refresh participants list after import
            await fetchParticipants(eventId)
            
            // Return the detailed response including success count and skipped count
            return response.data.result || response.data
        } catch (err) {
            error.value = err.response?.data?.message || '匯入參與者失敗'
            console.error('Error importing participants:', err)
            console.error('Error details:', err.response?.data)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete all participants for an event
    const deleteAllParticipants = async (eventId) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.delete(`/lottery/events/${eventId}/participants`)
            // Refresh participants list after deletion
            await fetchParticipants(eventId)
            return response.data.result
        } catch (err) {
            if (err.response?.status === 400) {
                error.value = '無法刪除參與者：活動已經抽獎完成'
            } else {
                error.value = err.response?.data?.message || '刪除所有參與者失敗'
            }
            console.error('Error deleting all participants:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete a specific participant (not supported by API - removed)
    const deleteParticipant = async (participantId) => {
        error.value = '此功能暫不支援，請使用「刪除所有參與者」功能'
        throw new Error('此功能暫不支援')
    }

    // Helper function to parse CSV line with proper handling of quotes and commas
    const parseCSVLine = (line) => {
        const result = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Handle escaped quotes
                    current += '"'
                    i++ // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator found
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        
        // Add the last field
        result.push(current.trim())
        
        return result
    }

    // Parse CSV file and extract student data
    const parseCsvFile = (file, eventType) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const text = e.target.result
                    const lines = text.split('\n').filter(line => line.trim() !== '')
                    
                    if (lines.length < 2) {
                        reject(new Error('CSV 檔案格式不正確：至少需要標題行和一行數據'))
                        return
                    }

                    // Parse header
                    const headers = parseCSVLine(lines[0])
                    
                    // Parse data rows
                    const students = []
                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i])
                        
                        if (values.length !== headers.length) continue // Skip malformed rows
                        
                        const row = {}
                        headers.forEach((header, index) => {
                            row[header] = values[index]
                        })

                        const student = {
                            id: row['學號'] || row['student_id'] || row['id'] || '',
                            name: row['姓名'] || row['name'] || null,
                            department: row['系所'] || row['department'] || null,
                            grade: row['年級'] || row['grade'] || null
                        }

                        // Add final_teaching specific fields according to API schema
                        if (eventType === 'final_teaching') {
                            // Convert numeric strings to integers
                            const requiredSurveys = row['應填問卷數'] || row['required_surveys']
                            const completedSurveys = row['已填問卷數'] || row['completed_surveys']
                            student.required_surveys = requiredSurveys ? parseInt(requiredSurveys) : null
                            student.completed_surveys = completedSurveys ? parseInt(completedSurveys) : null
                            
                            // Handle surveys_completed
                            const surveysCompleted = row['是否填畢'] || row['surveys_completed']
                            let surveysCompletedResult = null
                            if (surveysCompleted !== null && surveysCompleted !== undefined && String(surveysCompleted).trim() !== '') {
                                const isCompleted = surveysCompleted === '是' || surveysCompleted === 'true' || surveysCompleted === true || surveysCompleted === '1'
                                surveysCompletedResult = isCompleted ? 'Y' : 'N'
                                student.surveys_completed = surveysCompletedResult
                            } else {
                                student.surveys_completed = 'N' // Default to N if empty
                                surveysCompletedResult = 'N'
                            }
                            
                            // Handle valid_surveys with new logic
                            const validSurveys = row['有效問卷'] || row['valid_surveys']
                            if (validSurveys !== null && validSurveys !== undefined && String(validSurveys).trim() !== '') {
                                const validStr = String(validSurveys).trim().toUpperCase()
                                if (validStr === 'N' || validStr === '否') {
                                    student.valid_surveys = 'N'
                                } else if (validStr === 'Y' || validStr === '是') {
                                    student.valid_surveys = 'Y'
                                } else {
                                    // If not clear Y or N, follow surveys_completed logic
                                    student.valid_surveys = surveysCompletedResult === 'Y' ? 'Y' : 'N'
                                }
                            } else {
                                // If empty, follow surveys_completed logic
                                student.valid_surveys = surveysCompletedResult === 'Y' ? 'Y' : 'N'
                            }
                            
                            // Handle student_type (外籍生) - if empty, default to N
                            const studentType = row['身份別'] || row['student_type'] || row['外籍生']
                            if (studentType !== null && studentType !== undefined && String(studentType).trim() !== '') {
                                const type = String(studentType).trim()
                                student.student_type = ['Y', '外籍生', '僑生', '是', '1'].includes(type) ? 'Y' : 'N'
                            } else {
                                student.student_type = 'N' // Default to N if empty
                            }
                            
                            // Map all fields with proper null handling
                            student.id_number = (row['身份證字號'] || row['id_number']) && String(row['身份證字號'] || row['id_number']).trim() !== '' ? String(row['身份證字號'] || row['id_number']).trim() : null
                            student.address = (row['戶籍地址'] || row['address']) && String(row['戶籍地址'] || row['address']).trim() !== '' ? String(row['戶籍地址'] || row['address']).trim() : null
                            student.phone = (row['手機'] || row['phone']) && String(row['手機'] || row['phone']).trim() !== '' ? String(row['手機'] || row['phone']).trim() : null
                            student.email = (row['電子郵件'] || row['email']) && String(row['電子郵件'] || row['email']).trim() !== '' ? String(row['電子郵件'] || row['email']).trim() : null
                        }

                        students.push(student)
                    }

                    resolve(students)
                } catch (error) {
                    reject(new Error('CSV 檔案解析失敗：' + error.message))
                }
            }
            reader.onerror = () => reject(new Error('檔案讀取失敗'))
            reader.readAsText(file, 'UTF-8')
        })
    }

    // Parse Excel file and extract student data
    const parseExcelFile = (file, eventType) => {
        console.log('=== parseExcelFile 開始 ===')
        console.log('檔案:', file.name, '大小:', file.size)
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    
                    // Enhanced Excel reading options
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellText: false,
                        cellDates: true,
                        dateNF: 'yyyy-mm-dd',
                        codepage: 65001 // UTF-8 encoding
                    })
                    
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        throw new Error('Excel 檔案中沒有找到工作表')
                    }
                    
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    
                    if (!worksheet) {
                        throw new Error('無法讀取工作表內容')
                    }

                    // Try to detect if the file has headers by analyzing first few rows
                    const rawData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '',
                        blankrows: false,
                        raw: false
                    })
                    
                    if (rawData.length === 0) {
                        throw new Error('Excel 檔案中沒有數據，請確認檔案包含學生資料')
                    }

                    let hasHeaders = false
                    let dataStartRow = 0
                    let foundDataStart = false
                    
                    // Check if first row contains typical header names
                    if (rawData.length > 0) {
                        const firstRow = rawData[0]
                        console.log('First row for header detection:', firstRow)
                        
                        const headerKeywords = ['學號', '姓名', '系所', '年級', '應填問卷數', '已填問卷數', '是否填畢', '外籍生', '有效問卷', '身份證字號', '戶籍地址', '手機', 'Email',
                                              'student_id', 'name', 'department', 'grade', 'required_surveys', 'completed_surveys', 'surveys_completed', 'student_type', 'valid_surveys', 'id_number', 'address', 'phone', 'email',
                                              '序號', '序', 'ID', 'id']
                        
                        const secondCell = String(firstRow[1] || '').trim()
                        console.log('Second cell for header detection:', secondCell)
                        
                        // 檢查第一行是否為HTML檔案的標題行（如：教學意見調查填答筆數查詢）
                        const firstCell = String(firstRow[0] || '').trim()
                        if (firstCell.includes('教學意見調查') || firstCell.includes('填答筆數查詢') || firstCell.includes('學年期為')) {
                            console.log('Detected HTML Excel title row, looking for actual data start')
                            // 尋找真正的資料開始行
                            for (let i = 1; i < Math.min(10, rawData.length); i++) {
                                const testRow = rawData[i]
                                const testSecondCell = String(testRow[1] || '').trim()
                                
                                // 檢查是否有標題關鍵字，如果有則跳過
                                const hasHeaderKeywords = testRow.some(cell => {
                                    if (!cell) return false
                                    const cellStr = String(cell).trim()
                                    return headerKeywords.includes(cellStr)
                                })
                                if (hasHeaderKeywords) {
                                    console.log(`Row ${i + 1} contains header keywords, skipping`)
                                    continue
                                }
                                
                                // 檢查是否是學生資料行
                                if (testSecondCell && testSecondCell.match(/^\d{8,}$/)) {
                                    console.log(`Found data start at row ${i + 1}, student ID: ${testSecondCell}`)
                                    hasHeaders = false
                                    dataStartRow = i
                                    foundDataStart = true
                                    break
                                }
                            }
                            
                            if (!foundDataStart) {
                                console.log('No valid data rows found, using default start')
                                hasHeaders = false
                                dataStartRow = 1
                            }
                        } else {
                            // 檢查第二個欄位是否為數字學號格式（8位以上數字）
                            if (secondCell && secondCell.match(/^\d{8,}$/)) {
                                // 如果第二個欄位是數字學號，則第一行是資料不是標題
                                hasHeaders = false
                                console.log('Second cell is student ID format, no headers detected')
                            } else {
                                // 否則檢查是否包含標題關鍵字
                                hasHeaders = firstRow.some(cell => {
                                    if (!cell) return false
                                    const cellStr = String(cell).trim()
                                    const isHeaderKeyword = headerKeywords.includes(cellStr)
                                    if (isHeaderKeyword) {
                                        console.log('Found header keyword:', cellStr)
                                    }
                                    return isHeaderKeyword
                                })
                            }
                        }
                        
                        if (!foundDataStart) {
                            dataStartRow = hasHeaders ? 1 : 0
                        }
                        console.log('Final header detection:', { hasHeaders, dataStartRow, secondCell, foundDataStart })
                    }

                    console.log('Excel 檔案分析：', {
                        hasHeaders,
                        dataStartRow,
                        totalRows: rawData.length,
                        firstRow: rawData[0],
                        sampleRows: rawData.slice(0, 3)
                    })

                    const students = []
                    const errors = []

                    // Excel 欄位映射說明 (序號欄位不傳送到後端)
                    // A:序號(跳過), B:學號, C:姓名, D:系所, E:年級, F:應填問卷數, G:已填問卷數, H:是否填畢, I:外籍生, J:有效問卷, K:身份證字號, L:戶籍地址, M:手機, N:Email
                    // 注意：A欄的序號不會傳送到後端，只用於Excel內部排序

                    // Process data rows
                    for (let i = dataStartRow; i < rawData.length; i++) {
                        const row = rawData[i]
                        if (!row || row.length === 0 || row.every(cell => !cell)) {
                            continue // Skip empty rows
                        }

                        try {
                            let student = {}

                            // 檢查是否為原始問卷數據文件（基於標題行判斷）
                            const isRawSurveyData = hasHeaders && rawData[0] && 
                                rawData[0].includes('學號') && 
                                rawData[0].includes('識別碼') && 
                                rawData[0].includes('性別')

                            if (isRawSurveyData) {
                                // 原始問卷數據格式：學號, 識別碼, 年級, 性別, 學院, 系所, ...
                                console.log('檢測到原始問卷數據格式，使用動態解析')
                                
                                const headers = rawData[0]
                                const rowData = {}
                                headers.forEach((header, index) => {
                                    rowData[header] = row[index]
                                })
                                
                                // Add debugging for first few data rows
                                if (i <= dataStartRow + 2) {
                                    console.log(`Row ${i + 1} raw survey data:`, rowData)
                                }
                                
                                student = {
                                    id: String(rowData['學號'] || '').trim(),      // 學號
                                    name: rowData['識別碼'] || null,               // 使用識別碼作為姓名（脱敏）
                                    department: rowData['系所'] || null,          // 系所
                                    grade: rowData['年級'] && String(rowData['年級']).trim() !== '' ? String(rowData['年級']).trim() : null // 年級
                                }
                            } else {
                                // 標準抽獎格式：序號, 學號, 姓名, 系所, 年級, 應填問卷數, 已填問卷數, 是否填畢, 外籍生, 有效問卷, 身份證字號, 戶籍地址, 手機, Email
                                console.log('檢測到標準抽獎格式，使用固定位置解析')
                                
                                // Add debugging for first few data rows
                                if (i <= dataStartRow + 2) {
                                    console.log(`Row ${i + 1} standard format data:`, row)
                                    console.log(`Processing: SerialNo=${row[0]}, ID=${row[1]}, Name=${row[2]}, Dept=${row[3]}, Grade=${row[4]}`)
                                    console.log(`Surveys: Required=${row[5]}, Completed=${row[6]}, CompletedFlag=${row[7]}, StudentType=${row[8]}, Valid=${row[9]}`)
                                    console.log(`Contact: IDNumber=${row[10]}, Address=${row[11]}, Phone=${row[12]}, Email=${row[13]}`)
                                }
                                
                                // 跳過序號欄位（row[0]），從學號開始
                                student = {
                                    id: String(row[1] || '').trim(), // Column B: 學號 (跳過A欄的序號)
                                    name: row[2] || null,            // Column C: 姓名
                                    department: row[3] || null,      // Column D: 系所  
                                    grade: row[4] && String(row[4]).trim() !== '' ? String(row[4]).trim() : null // Column E: 年級
                                }
                            }
                            
                            // Add final_teaching specific fields
                            if (eventType === 'final_teaching') {
                                if (isRawSurveyData) {
                                    // 原始問卷數據 - 設置默認值，因為原始數據中沒有這些字段
                                    student.required_surveys = 1    // 假設每個學生應填1份問卷
                                    student.completed_surveys = 1   // 假設都已填寫（因為有數據就代表填寫了）
                                } else {
                                    // 標準格式
                                    student.required_surveys = row[5] && !isNaN(row[5]) ? parseInt(String(row[5])) : null    // F: 應填問卷數
                                    student.completed_surveys = row[6] && !isNaN(row[6]) ? parseInt(String(row[6])) : null   // G: 已填問卷數
                                }
                                
                                // Handle surveys_completed - H: 是否填畢 - 直接使用檔案中的值
                                let surveysCompletedResult = null
                                
                                if (isRawSurveyData) {
                                    // 原始問卷數據 - 設置默認值
                                    surveysCompletedResult = 'Y' // 假設都已填畢（因為有數據就代表填寫了）
                                    student.surveys_completed = surveysCompletedResult
                                } else {
                                    // 標準格式
                                    const surveysCompletedValue = row[7]
                                    
                                    // Debug surveys_completed processing
                                    if (i <= dataStartRow + 2) {
                                        console.log(`Row ${i + 1} surveys_completed processing:`, {
                                            original: surveysCompletedValue,
                                            type: typeof surveysCompletedValue,
                                            trimmed: surveysCompletedValue ? String(surveysCompletedValue).trim() : 'null/undefined'
                                        })
                                    }
                                    
                                    if (surveysCompletedValue !== null && surveysCompletedValue !== undefined && String(surveysCompletedValue).trim() !== '') {
                                        const completedStr = String(surveysCompletedValue).trim().toUpperCase()
                                        // 直接使用檔案中的值，如果是 Y/N 就直接使用，否則轉換
                                        if (completedStr === 'Y' || completedStr === 'N') {
                                            surveysCompletedResult = completedStr
                                        } else {
                                            // 如果不是 Y/N，則進行轉換
                                            const isCompleted = ['是', 'TRUE', '1', 'YES'].includes(completedStr) || surveysCompletedValue === true
                                            surveysCompletedResult = isCompleted ? 'Y' : 'N'
                                        }
                                        student.surveys_completed = surveysCompletedResult
                                    } else {
                                        student.surveys_completed = 'N' // Default to N if empty
                                        surveysCompletedResult = 'N'
                                    }
                                }
                                
                                // Handle student_type (外籍生) - I: 外籍生 - if empty, default to N
                                if (isRawSurveyData) {
                                    // 原始問卷數據 - 設置默認值
                                    student.student_type = 'N' // 假設都是本地學生
                                } else {
                                    // 標準格式
                                    const studentTypeValue = row[8]
                                    if (studentTypeValue !== null && studentTypeValue !== undefined && String(studentTypeValue).trim() !== '') {
                                        const type = String(studentTypeValue).trim()
                                        student.student_type = ['Y', '外籍生', '僑生', '是', '1'].includes(type) ? 'Y' : 'N'
                                    } else {
                                        student.student_type = 'N' // Default to N if empty
                                    }
                                }
                                
                                // Handle valid_surveys with new logic - J: 有效問卷
                                if (isRawSurveyData) {
                                    // 原始問卷數據 - 設置默認值
                                    student.valid_surveys = surveysCompletedResult === 'Y' ? 'Y' : 'N'
                                } else {
                                    // 標準格式
                                    const validSurveysValue = row[9]
                                    if (validSurveysValue !== null && validSurveysValue !== undefined && String(validSurveysValue).trim() !== '') {
                                        const validStr = String(validSurveysValue).trim().toUpperCase()
                                        if (validStr === 'N' || validStr === '否') {
                                            student.valid_surveys = 'N'
                                        } else if (validStr === 'Y' || validStr === '是') {
                                            student.valid_surveys = 'Y'
                                        } else {
                                            // If not clear Y or N, follow surveys_completed logic
                                            student.valid_surveys = surveysCompletedResult === 'Y' ? 'Y' : 'N'
                                        }
                                    } else {
                                        // If empty, follow surveys_completed logic
                                        student.valid_surveys = surveysCompletedResult === 'Y' ? 'Y' : 'N'
                                    }
                                }
                                
                                // Map all contact fields correctly
                                if (isRawSurveyData) {
                                    // 原始問卷數據 - 沒有聯絡信息，設置為空
                                    student.id_number = null
                                    student.address = null
                                    student.phone = null
                                    student.email = null
                                } else {
                                    // 標準格式
                                    student.id_number = row[10] && String(row[10]).trim() !== '' ? String(row[10]).trim() : null // K: 身份證字號
                                    student.address = row[11] && String(row[11]).trim() !== '' ? String(row[11]).trim() : null   // L: 戶籍地址  
                                    student.phone = row[12] && String(row[12]).trim() !== '' ? String(row[12]).trim() : null     // M: 手機
                                    student.email = row[13] && String(row[13]).trim() !== '' ? String(row[13]).trim() : null     // N: Email
                                }
                            }
                            


                            // Validate required fields
                            if (!student.id) {
                                errors.push(`第 ${i + 1} 行：缺少學號`)
                                continue
                            }

                            // Debug first few students
                            if (students.length < 3) {
                                console.log(`Student ${students.length + 1} final object (from row ${i + 1}):`, student)
                            }

                            students.push(student)
                        } catch (rowError) {
                            errors.push(`第 ${i + 1} 行：${rowError.message}`)
                        }
                    }

                    if (students.length === 0) {
                        let errorMsg = '沒有找到有效的學生資料'
                        if (errors.length > 0) {
                            errorMsg += '\n\n錯誤詳情：\n' + errors.slice(0, 5).join('\n')
                            if (errors.length > 5) {
                                errorMsg += `\n... 還有 ${errors.length - 5} 個錯誤`
                            }
                        }
                        throw new Error(errorMsg)
                    }

                    // Log warnings for errors but still resolve with valid students
                    if (errors.length > 0) {
                        console.warn('Excel 解析警告：', errors)
                    }

                    resolve(students)
                } catch (error) {
                    console.error('Excel 檔案解析錯誤：', error)
                    reject(new Error('Excel 檔案解析失敗：' + error.message))
                }
            }
            reader.onerror = (error) => {
                console.error('檔案讀取錯誤：', error)
                reject(new Error('檔案讀取失敗，請確認檔案沒有損壞且格式正確'))
            }
            reader.readAsArrayBuffer(file)
        })
    }

    // Parse file (both Excel and CSV)
    const parseStudentFile = (file, eventType) => {
        const fileExtension = file.name.split('.').pop().toLowerCase()
        console.log('=== parseStudentFile 開始 ===')
        console.log('檔案名稱:', file.name)
        console.log('檔案副檔名:', fileExtension)
        console.log('檔案大小:', file.size)
        console.log('活動類型:', eventType)
        
        if (fileExtension === 'csv') {
            console.log('使用 CSV 解析器')
            return parseCsvFile(file, eventType)
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            console.log('使用 Excel 解析器')
            return parseExcelFile(file, eventType)
        } else {
            return Promise.reject(new Error('不支援的檔案格式，請上傳 Excel (.xlsx, .xls) 或 CSV (.csv) 檔案'))
        }
    }

    // Email related state
    const emailTemplateVariables = ref([])

    // Get template variables for email (using static data since API doesn't provide this endpoint)
    const fetchEmailTemplateVariables = async () => {
        // Return static template variables since the API doesn't provide this endpoint
        const staticVariables = [
            { key: 'winner_name', label: '得獎人姓名', icon: '👤', description: '插入得獎人的姓名' },
            { key: 'event_name', label: '活動名稱', icon: '🎯', description: '插入抽獎活動的名稱' },
            { key: 'prize_name', label: '獎項名稱', icon: '🏆', description: '插入得獎人獲得的獎項' },
            { key: 'student_id', label: '得獎人學號', icon: '🎓', description: '插入得獎人的學號' },
            { key: 'department', label: '得獎人系所', icon: '🏢', description: '插入得獎人的系所' },
            { key: 'grade', label: '得獎人年級', icon: '📚', description: '插入得獎人的年級' },
            { key: 'event_date', label: '活動日期', icon: '📅', description: '插入活動的日期' },
            { key: 'sender_name', label: '寄件人名稱', icon: '✉️', description: '插入寄件人的名稱' }
        ];
        
        emailTemplateVariables.value = staticVariables;
        return staticVariables;
    }

    // Send winners notification email
    const sendWinnersNotification = async (eventId, emailData) => {
        loading.value = true
        error.value = null

        try {
            const response = await api.post(`/email/send-winners/${eventId}`, emailData)
            return response.data.result
        } catch (err) {
            error.value = err.response?.data?.message || '寄送得獎通知失敗'
            console.error('Error sending winners notification:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        lotteryTypes,
        selectedType,
        lotteryEvents,
        currentEvent,
        participants,
        participantsTotal,
        prizeSettings,
        winners,
        loading,
        error,
        emailTemplateVariables,
        selectType,
        fetchLotteryEvents,
        selectEvent,
        fetchParticipants,
        savePrizeSettings,
        fetchPrizeSettings,
        runLottery,
        exportWinners,
        fetchWinners,
        createLotteryEvent,
        updateLotteryEvent,
        importParticipants,
        deleteAllParticipants,
        deleteParticipant,
        parseExcelFile,
        parseCsvFile,
        parseStudentFile,
        fetchEmailTemplateVariables,
        sendWinnersNotification,
        deleteEvent,
        testWinnersNotification
    }
}) 