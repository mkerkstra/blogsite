import {Tabs, TabList, Tab, TabPanels, TabPanel, Table, Tbody, Tr, Td, Text} from '@chakra-ui/react';
import {myExperience} from '../data/myExperience';

export const Experience = () => {
  return (
    <Tabs
      size='lg'
      isFitted
      defaultIndex={-1}
    >
      <TabList>
        {myExperience.map(({company}) => (
          <Tab key={company?.name ?? company.quickOverview}>{company?.name ?? company.quickOverview}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {myExperience.map(({company, role, projects}, index) => (
          <TabPanel key={index}>
            <Tabs key={index} size='md' defaultIndex={-1}>
              <TabList>
                {Object.keys(myExperience[index]).map((key) => (
                  <Tab key={key}>{key}</Tab>
                ))}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Table>
                    <Tbody>
                      <Tr>
                        <Td><Text>name: </Text></Td>
                        <Td><Text>size: </Text></Td>
                        <Td><Text>overview: </Text></Td>
                      </Tr>
                      <Tr>
                        <Td><Text>{company.name}</Text></Td>
                        <Td><Text>{company.size}</Text></Td>
                        <Td><Text>{company.quickOverview}</Text></Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TabPanel>
                <TabPanel>
                  <Text>{role.title}</Text>
                  <Text>{role.time.start} - {role.time.end || `present`}</Text>
                  <Text>{role.overview}</Text>
                </TabPanel>
                <TabPanel>
                  <Tabs size='md' defaultIndex={-1}>
                    <TabList>
                      {projects.map(({title}) => (
                        <Tab key={title}>{title}</Tab>
                      ))}
                    </TabList>
                    <TabPanels>
                      {projects.map(({title, overview, growth: projectGrowth}) => (
                        <TabPanel key={title}>
                          <Text>{overview}</Text>
                          <Tabs size='sm' defaultIndex={-1}>
                            <TabList>
                              {projectGrowth.map(({point}) => (
                                <Tab key={point}>{point}</Tab>
                              ))}
                            </TabList>
                            <TabPanels>
                              {projectGrowth.map(({point, details}, index) => (
                                <TabPanel key={index}>
                                  <Text>{details}</Text>
                                </TabPanel>
                              ))}
                            </TabPanels>
                          </Tabs>
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </Tabs>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};
