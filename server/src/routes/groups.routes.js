import { Router } from 'express'
import {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroupByCode,
  getGroupBalances,
  getGroupSettlements,
  updateGroup,
  getGroupActivity,
   deleteGroup,
} from '../controllers/groups.controller.js'


const router = Router()

router.post('/',                    createGroup)
router.get('/',                     getMyGroups)
router.get('/:id',                  getGroupById)
router.get('/:id/balances',         getGroupBalances)
router.get('/:id/settlements',      getGroupSettlements)
router.post('/join/:inviteCode',     joinGroupByCode)
router.patch('/:id',                updateGroup)
router.get('/:id/activity', getGroupActivity)
router.delete('/:id', deleteGroup)

export default router