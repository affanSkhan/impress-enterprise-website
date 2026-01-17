import { useRouter } from 'next/router'
import NewProductPage from '../new'

export default function NewProductByType() {
  const router = useRouter()
  const { type } = router.query

  return <NewProductPage initialBusinessType={type} />
}
