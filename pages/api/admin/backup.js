import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'
import archiver from 'archiver'

export const config = {
  api: {
    responseLimit: false, // Disable response limit for large backups
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 1. Auth Check
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || roleData.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // 2. Start Backup
  try {
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.zip`)
    
    archive.pipe(res)

    // 3. Database Backup
    // List of tables to backup
    const tables = [
      'products', 
      'categories', 
      'customers', 
      'orders', 
      'order_items',
      'cart_items', 
      'invoices', 
      'invoice_items',
      'user_roles',
      // Add other tables as needed
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('*')
        if (!error && data) {
          archive.append(JSON.stringify(data, null, 2), { name: `database/${table}.json` })
        }
      } catch (err) {
        console.warn(`Failed to backup table ${table}:`, err)
      }
    }

    // 4. Storage Backup
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      if (buckets) {
        for (const bucket of buckets) {
          const files = await listAllFiles(supabaseAdmin, bucket.name)
          for (const file of files) {
             try {
               const { data: fileData, error: downloadError } = await supabaseAdmin.storage.from(bucket.name).download(file.name)
               if (!downloadError && fileData) {
                 const buffer = Buffer.from(await fileData.arrayBuffer())
                 archive.append(buffer, { name: `storage/${bucket.name}/${file.name}` })
               }
             } catch (err) {
               console.warn(`Failed to download file ${file.name} from bucket ${bucket.name}:`, err)
             }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to backup storage:', err)
    }

    await archive.finalize()
  } catch (error) {
    console.error('Backup failed:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Backup failed' })
    }
  }
}

async function listAllFiles(supabase, bucketName, path = '') {
  let allFiles = []
  try {
    const { data, error } = await supabase.storage.from(bucketName).list(path)
    
    if (error || !data) return []

    for (const item of data) {
      if (!item.id) {
        // It's a folder (id is usually null or undefined for folders in list())
        const subFiles = await listAllFiles(supabase, bucketName, `${path}${item.name}/`)
        allFiles = [...allFiles, ...subFiles]
      } else {
        allFiles.push({ ...item, name: `${path}${item.name}` })
      }
    }
  } catch (err) {
    console.warn(`Error listing files in ${bucketName}/${path}:`, err)
  }
  return allFiles
}
