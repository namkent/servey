import { getDb } from './index.js'
import { UserModel } from '../models/user.js'
import { SurveyModel } from '../models/survey.js'
import { ResponseModel } from '../models/response.js'

export function seedDatabase() {
  const db = getDb()

  // 1. Seed Admin User
  let admin = UserModel.findByEmail('admin@survey.local')
  if (!admin) {
    admin = UserModel.create({
      id: 'usr_admin_001',
      name: 'Nguyễn Văn Quản Trị',
      email: 'admin@survey.local',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminBoss',
      provider: 'dev',
    })
    UserModel.updateRole(admin.id, 'admin')
    admin.role = 'admin'
  }

  // 2. Seed Regular User
  let user = UserModel.findByEmail('user@survey.local')
  if (!user) {
    user = UserModel.create({
      id: 'usr_user_001',
      name: 'Trần Thị Nhân Viên',
      email: 'user@survey.local',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmployeeJane',
      provider: 'dev',
    })
  }

  // 3. Seed Sample Surveys
  const existingSurveys = SurveyModel.list({ activeOnly: false })
  if (existingSurveys.length === 0) {
    const sampleSchema1 = {
      title: 'Khảo sát mức độ hài lòng về môi trường làm việc 2024',
      description: 'Ý kiến của bạn là cơ sở quan trọng giúp công ty cải thiện điều kiện làm việc và phúc lợi.',
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'work_satisfaction',
              title: 'Bạn đánh giá thế nào về mức độ hài lòng chung với công việc hiện tại?',
              isRequired: true,
              choices: [
                { value: 'rat_hai_long', text: 'Rất hài lòng' },
                { value: 'hai_long', text: 'Hài lòng' },
                { value: 'binh_thuong', text: 'Bình thường' },
                { value: 'chua_hai_long', text: 'Chưa hài lòng' }
              ]
            },
            {
              type: 'checkbox',
              name: 'benefits_like',
              title: 'Những chính sách/phúc lợi nào bạn đánh giá cao nhất?',
              choices: [
                { value: 'che_do_bao_hiem', text: 'Bảo hiểm sức khỏe cao cấp' },
                { value: 'gio_lam_linh_hoat', text: 'Thời gian làm việc linh hoạt' },
                { value: 'du_lich_hang_nam', text: 'Du lịch nghỉ dưỡng hàng năm' },
                { value: 'dao_tao_phat_trien', text: 'Ngân sách đào tạo cá nhân' },
                { value: 'com_trua_snack', text: 'Ăn trưa & Pantry miễn phí' }
              ]
            },
            {
              type: 'comment',
              name: 'feedback_suggestions',
              title: 'Bạn có đề xuất gì để nâng cao chất lượng môi trường làm việc?',
              placeholder: 'Nhập ý kiến đóng góp của bạn tại đây...'
            }
          ]
        }
      ]
    }

    const survey1 = SurveyModel.create({
      title: 'Khảo sát mức độ hài lòng về môi trường làm việc 2024',
      slug: 'khao-sat-hai-long-nhan-vien',
      description: 'Ý kiến của bạn là cơ sở quan trọng giúp công ty cải thiện điều kiện làm việc và phúc lợi.',
      schema: sampleSchema1,
      createdBy: admin.id,
      isPublic: 1,
    })

    const sampleSchema2 = {
      title: 'Đánh giá trang thiết bị & cơ sở vật chất văn phòng',
      description: 'Khảo sát nhanh nhu cầu nâng cấp máy tính, màn hình và tiện ích văn phòng.',
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'rating',
              name: 'equipment_rating',
              title: 'Đánh giá độ mượt và hiệu năng của thiết bị làm việc được cấp (1 - 5 sao):',
              rateMin: 1,
              rateMax: 5,
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'need_upgrade',
              title: 'Bạn có nhu cầu nâng cấp trang thiết bị nào không?',
              choices: [
                { value: 'man_hinh_roi', text: 'Màn hình rời 27 inch' },
                { value: 'chuot_ban_phim', text: 'Bàn phím cơ & chuột công thái học' },
                { value: 'tai_nghe_chong_on', text: 'Tai nghe chống ồn' },
                { value: 'ghe_cong_thai_hoc', text: 'Ghế công thái học' }
              ]
            }
          ]
        }
      ]
    }

    const survey2 = SurveyModel.create({
      title: 'Đánh giá trang thiết bị & cơ sở vật chất văn phòng',
      slug: 'danh-gia-trang-thiet-bi',
      description: 'Khảo sát nhanh nhu cầu nâng cấp máy tính, màn hình và tiện ích văn phòng.',
      schema: sampleSchema2,
      createdBy: admin.id,
      isPublic: 1,
    })

    // 4. Seed a completed response for survey 1
    ResponseModel.upsert(
      user.id,
      survey1.id,
      {
        work_satisfaction: 'rat_hai_long',
        benefits_like: ['gio_lam_linh_hoat', 'com_trua_snack', 'che_do_bao_hiem'],
        feedback_suggestions: 'Môi trường làm việc rất tốt, mong công ty tổ chức thêm nhiều buổi workshop kỹ thuật chia sẻ nội bộ.'
      },
      true // complete
    )

    console.log('[Seed] Database seeded with demo admin, user, 2 sample surveys, and 1 response.')
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
}
