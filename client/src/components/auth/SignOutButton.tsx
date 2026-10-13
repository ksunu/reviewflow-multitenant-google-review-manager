import { LogOut } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export function SignOutButton({ handleSignOut }: any) {
  const { t } = useTranslation()
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        render={
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="cursor-pointer"
            size="icon"
          >
            <LogOut size={16} />
          </Button>
        }
      />
      <PopoverContent className="w-20 d-flex justify-center items-center text-sm text-foreground">
        {t('auth.logout')}
      </PopoverContent>
    </Popover>
  )
}
