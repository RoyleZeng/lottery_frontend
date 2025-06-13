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

    // Import participants from Excel data
    const importParticipants = async (eventId, studentsData) => {
        loading.value = true
        error.value = null

        try {
            await api.post(`/lottery/events/${eventId}/participants`, {
                students: studentsData
            })
            // Refresh participants list after import
            await fetchParticipants(eventId)
            return true
        } catch (err) {
            error.value = err.response?.data?.message || '匯入參與者失敗'
            console.error('Error importing participants:', err)
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

    // Parse Excel file and extract student data
    const parseExcelFile = (file, eventType) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet)

                    const students = jsonData.map(row => {
                        const student = {
                            id: row['學號'] || row['student_id'] || row['id'] || '',
                            name: row['姓名'] || row['name'] || null,
                            department: row['系所'] || row['department'] || null,
                            grade: row['年級'] || row['grade'] || null
                        }

                        // Add final_teaching specific fields
                        if (eventType === 'final_teaching') {
                            student.required_surveys = row['應填問卷數'] || row['required_surveys'] || null
                            student.completed_surveys = row['已填問卷數'] || row['completed_surveys'] || null
                            student.surveys_completed = row['是否填畢'] || row['surveys_completed'] || null
                            student.valid_surveys = row['有效問卷'] || row['valid_surveys'] || null
                        }

                        return student
                    })

                    resolve(students)
                } catch (error) {
                    reject(new Error('Excel 檔案解析失敗：' + error.message))
                }
            }
            reader.onerror = () => reject(new Error('檔案讀取失敗'))
            reader.readAsArrayBuffer(file)
        })
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
            const response = await api.post(`/lottery/events/${eventId}/winners/email`, emailData)
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
        importParticipants,
        deleteAllParticipants,
        deleteParticipant,
        parseExcelFile,
        fetchEmailTemplateVariables,
        sendWinnersNotification
    }
}) 