import { ChartAreaInteractive } from './_components/chart-area-interactive'
import { DataTable } from './_components/data-table'
import { SectionCards } from './_components/section-cards'
import { columns } from './_components/dashboard-columns'

import data from './data.json'

const Page = () => {
  return (
    <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
      <SectionCards />
      <div className='px-4 lg:px-6'>
        <ChartAreaInteractive />
      </div>
      <div className='px-4 lg:px-6'>
        <DataTable
          columns={columns}
          data={data}
          searchKey='header'
          totalCount={data.length}
        />
      </div>
    </div>
  )
}

export default Page
