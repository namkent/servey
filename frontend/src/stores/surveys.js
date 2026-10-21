import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/axios.js'

export const useSurveyStore = defineStore('surveys', () => {
  const surveys = ref([])
  const currentSurvey = ref(null)
  const currentResponse = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchSurveys() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/surveys')
      surveys.value = data.surveys
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchSurvey(id) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/surveys/${id}`)
      currentSurvey.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchMyResponse(surveyId) {
    try {
      const { data } = await api.get(`/surveys/${surveyId}/response`)
      currentResponse.value = data
      return data
    } catch {
      currentResponse.value = null
      return null
    }
  }

  async function saveResponse(surveyId, responseData, isComplete = false) {
    const { data } = await api.post(`/surveys/${surveyId}/response`, {
      data: responseData,
      isComplete,
    })
    currentResponse.value = { exists: true, response: data }
    return data
  }

  async function fetchAllSurveys() {
    loading.value = true
    try {
      const { data } = await api.get('/surveys/all')
      return data
    } finally {
      loading.value = false
    }
  }

  async function createSurvey(payload) {
    const { data } = await api.post('/surveys', payload)
    return data
  }

  async function updateSurvey(id, payload) {
    const { data } = await api.put(`/surveys/${id}`, payload)
    return data
  }

  async function deleteSurvey(id) {
    await api.delete(`/surveys/${id}`)
    surveys.value = surveys.value.filter(s => s.id !== id)
  }

  async function fetchResults(surveyId) {
    const { data } = await api.get(`/surveys/${surveyId}/response/results`)
    return data
  }

  return {
    surveys,
    currentSurvey,
    currentResponse,
    loading,
    error,
    fetchSurveys,
    fetchSurvey,
    fetchMyResponse,
    saveResponse,
    fetchAllSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    fetchResults,
  }
})
